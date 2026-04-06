import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { body, validationResult } from 'express-validator';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../common/email.js';
import { authMiddleware } from '../../common/auth.middleware.js';

const router = Router();

// ═══ HELPERS ═══

function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
  return { accessToken, refreshToken };
}

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ═══ REGISTER ═══

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { email, username, password } = req.body;
    const prisma = req.prisma;

    try {
      // Check uniqueness
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existing) {
        const field = existing.email === email ? 'email' : 'username';
        return res.status(409).json({ error: { message: `This ${field} is already taken` } });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          displayName: username,
        },
      });

      // Generate verification token
      const verifyToken = randomUUID();
      await prisma.emailVerification.create({
        data: {
          email,
          token: verifyToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Send verification email (non-blocking)
      sendVerificationEmail(email, verifyToken).catch(emailErr => {
        console.error('Failed to send verification email:', emailErr);
      });

      res.status(201).json({
        message: 'Аккаунт создан! Проверьте email для подтверждения.',
        needsVerification: true,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: { message: 'Registration failed' } });
    }
  }
);

// ═══ LOGIN ═══

router.post('/login',
  body('login').isLength({ min: 1 }),
  body('password').isLength({ min: 1 }),
  async (req, res) => {
    const { login: loginField, password } = req.body;
    const prisma = req.prisma;

    try {
      // Support login by email or username
      const isEmail = loginField.includes('@');
      const user = isEmail
        ? await prisma.user.findUnique({ where: { email: loginField.toLowerCase().trim() } })
        : await prisma.user.findUnique({ where: { username: loginField.trim() } });
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: { message: 'Invalid login or password' } });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: { message: 'Account is banned' } });
      }

      if (!user.isVerified) {
        return res.status(403).json({ error: { message: 'Подтвердите email перед входом. Проверьте почту.', code: 'EMAIL_NOT_VERIFIED' } });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: { message: 'Invalid login or password' } });
      }

      const { accessToken, refreshToken } = generateTokens(user.id, user.role);

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      setTokenCookies(res, accessToken, refreshToken);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
        },
        accessToken,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: { message: 'Login failed' } });
    }
  }
);

// ═══ REFRESH TOKEN ═══

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) {
    return res.status(401).json({ error: { message: 'Refresh token required' } });
  }

  const prisma = req.prisma;

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const session = await prisma.session.findUnique({ where: { refreshToken: token } });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: { message: 'Invalid session' } });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isBanned) {
      return res.status(401).json({ error: { message: 'Account unavailable' } });
    }

    // Rotate refresh token
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid refresh token' } });
  }
});

// ═══ LOGOUT ═══

router.post('/logout', authMiddleware, async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await req.prisma.session.deleteMany({ where: { refreshToken: token } });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out' });
});

// ═══ ME ═══

router.get('/me', authMiddleware, async (req, res) => {
  const user = await req.prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, username: true, displayName: true,
      avatar: true, cover: true, role: true, isVerified: true, isAdmin: true,
      bio: true, website: true, location: true, skills: true, socialLinks: true, notificationPrefs: true,
      _count: { select: { projects: true, followers: true, following: true } },
    },
  });
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });
  res.json({ user });
});

// ═══ FORGOT PASSWORD ═══

router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const { email } = req.body;
    const prisma = req.prisma;

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: 'If email exists, reset link was sent' });

    const token = randomUUID();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email (non-blocking)
    sendPasswordResetEmail(email, token).catch(err => {
      console.error('Failed to send reset email:', err);
    });

    res.json({ message: 'If email exists, reset link was sent' });
  }
);

// ═══ RESET PASSWORD ═══

router.post('/reset-password',
  body('token').isString(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const { token, password } = req.body;
    const prisma = req.prisma;

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return res.status(400).json({ error: { message: 'Invalid or expired reset token' } });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
      // Invalidate all sessions
      prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);

    res.json({ message: 'Password reset successfully' });
  }
);

// ═══ VERIFY EMAIL ═══

router.post('/verify-email',
  body('token').isString(),
  async (req, res) => {
    const { token } = req.body;
    const prisma = req.prisma;

    const verification = await prisma.emailVerification.findUnique({ where: { token } });
    if (!verification || verification.expiresAt < new Date()) {
      return res.status(400).json({ error: { message: 'Invalid or expired verification token' } });
    }

    await prisma.user.updateMany({
      where: { email: verification.email },
      data: { isVerified: true },
    });

    await prisma.emailVerification.delete({ where: { id: verification.id } });

    res.json({ message: 'Email verified' });
  }
);

// ═══ RESEND VERIFICATION ═══

router.post('/resend-verification',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const { email } = req.body;
    const prisma = req.prisma;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isVerified) {
      return res.json({ message: 'Если email существует и не подтверждён, письмо отправлено.' });
    }

    // Delete old tokens
    await prisma.emailVerification.deleteMany({ where: { email } });

    const verifyToken = randomUUID();
    await prisma.emailVerification.create({
      data: {
        email,
        token: verifyToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    sendVerificationEmail(email, verifyToken).catch(err => {
      console.error('Failed to resend verification email:', err);
    });

    res.json({ message: 'Если email существует и не подтверждён, письмо отправлено.' });
  }
);

export default router;
