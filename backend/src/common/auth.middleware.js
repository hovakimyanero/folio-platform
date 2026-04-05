import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  // Try cookie first, then Authorization header
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token expired', code: 'TOKEN_EXPIRED' } });
    }
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
}

export function optionalAuth(req, res, next) {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = payload.userId;
    req.userRole = payload.role;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}

export function adminOnly(req, res, next) {
  if (!req.userRole || req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: { message: 'Admin access required' } });
  }
  next();
}
