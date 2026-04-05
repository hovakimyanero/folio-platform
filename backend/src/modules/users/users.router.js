import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';
import multer from 'multer';
import { uploadFile } from '../../common/upload.js';
import { shouldNotify } from '../../common/notifications.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ═══ DATA EXPORT (must be before /:username) ═══

router.get('/me/export', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, username: true, displayName: true, bio: true,
        avatar: true, cover: true, website: true, location: true, skills: true,
        specialization: true, languages: true, birthDate: true,
        socialLinks: true, createdAt: true,
      },
    });
    const projects = await prisma.project.findMany({
      where: { authorId: req.userId },
      select: { id: true, title: true, description: true, tags: true, tools: true, createdAt: true, media: { select: { url: true, type: true } } },
    });
    const comments = await prisma.comment.findMany({
      where: { userId: req.userId },
      select: { id: true, content: true, createdAt: true, projectId: true },
    });
    const likes = await prisma.like.findMany({
      where: { userId: req.userId },
      select: { projectId: true, createdAt: true },
    });
    res.json({ user, projects, comments, likes, exportedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: { message: 'Failed to export data' } });
  }
});

// ═══ DELETE ACCOUNT (must be before /:username) ═══

router.delete('/me', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  try {
    await prisma.notification.deleteMany({ where: { OR: [{ recipientId: req.userId }, { actorId: req.userId }] } });
    await prisma.message.deleteMany({ where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] } });
    await prisma.comment.deleteMany({ where: { userId: req.userId } });
    await prisma.like.deleteMany({ where: { userId: req.userId } });
    await prisma.follow.deleteMany({ where: { OR: [{ followerId: req.userId }, { followingId: req.userId }] } });
    await prisma.challengeEntry.deleteMany({ where: { userId: req.userId } });
    await prisma.collection.deleteMany({ where: { userId: req.userId } });
    const projects = await prisma.project.findMany({ where: { authorId: req.userId }, select: { id: true } });
    for (const p of projects) {
      await prisma.media.deleteMany({ where: { projectId: p.id } });
    }
    await prisma.project.deleteMany({ where: { authorId: req.userId } });
    await prisma.user.delete({ where: { id: req.userId } });
    res.clearCookie('refreshToken');
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: { message: 'Failed to delete account' } });
  }
});

// ═══ GET USER PROFILE ═══

router.get('/:username', optionalAuth, async (req, res) => {
  const prisma = req.prisma;

  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      id: true, username: true, displayName: true, avatar: true, cover: true,
      bio: true, website: true, location: true, role: true, skills: true,
      specialization: true, languages: true, birthDate: true,
      socialLinks: true, isVerified: true, createdAt: true,
      _count: { select: { projects: true, followers: true, following: true } },
    },
  });

  if (!user) return res.status(404).json({ error: { message: 'User not found' } });

  let isFollowing = false;
  if (req.userId && req.userId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  res.json({ user: { ...user, isFollowing } });
});

// ═══ GET USER PROJECTS ═══

router.get('/:username/projects', optionalAuth, async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 20 } = req.query;

  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });

  const where = { authorId: user.id };
  // Only show published unless it's the user's own profile
  if (req.userId !== user.id) where.published = true;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({ projects, total });
});

// ═══ UPDATE PROFILE ═══

router.patch('/me', authMiddleware, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), async (req, res) => {
  const prisma = req.prisma;
  const { displayName, bio, website, location, skills, socialLinks, specialization, languages, birthDate } = req.body;

  const data = {};
  if (displayName !== undefined) data.displayName = displayName;
  if (bio !== undefined) data.bio = bio;
  if (website !== undefined) data.website = website;
  if (location !== undefined) data.location = location;
  if (skills) data.skills = JSON.parse(skills);
  if (specialization) data.specialization = JSON.parse(specialization);
  if (languages) data.languages = JSON.parse(languages);
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
  if (socialLinks) data.socialLinks = JSON.parse(socialLinks);

  // Upload avatar/cover
  if (req.files?.avatar?.[0]) {
    data.avatar = await uploadFile(req.files.avatar[0], `avatars/${req.userId}`);
  }
  if (req.files?.cover?.[0]) {
    data.cover = await uploadFile(req.files.cover[0], `covers/${req.userId}`);
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data,
    select: {
      id: true, username: true, displayName: true, avatar: true, cover: true,
      bio: true, website: true, location: true, skills: true, socialLinks: true,
      specialization: true, languages: true, birthDate: true,
    },
  });

  res.json({ user });
});

// ═══ UPDATE NOTIFICATION PREFS ═══

router.patch('/me/notifications', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { likes, comments, follows, messages } = req.body;

  const prefs = {
    likes: likes !== false,
    comments: comments !== false,
    follows: follows !== false,
    messages: messages !== false,
  };

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { notificationPrefs: prefs },
    select: { notificationPrefs: true },
  });

  res.json({ notificationPrefs: user.notificationPrefs });
});

// ═══ FOLLOW ═══

router.post('/:id/follow', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: { message: 'Cannot follow yourself' } });
  }

  try {
    await prisma.follow.create({
      data: { followerId: req.userId, followingId: req.params.id },
    });

    // Notification (respecting prefs)
    if (await shouldNotify(prisma, req.params.id, 'FOLLOW')) {
      await prisma.notification.create({
        data: {
          type: 'FOLLOW',
          recipientId: req.params.id,
          actorId: req.userId,
        },
      });
      req.io?.to(req.params.id).emit('notification', { type: 'FOLLOW' });
    }

    res.json({ following: true });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Already following' } });
    res.status(500).json({ error: { message: 'Failed to follow' } });
  }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  try {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: req.userId, followingId: req.params.id } },
    });
    res.json({ following: false });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to unfollow' } });
  }
});

// ═══ FOLLOWERS / FOLLOWING ═══

router.get('/:username/followers', async (req, res) => {
  const prisma = req.prisma;
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { select: { id: true, username: true, displayName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ followers: followers.map(f => f.follower) });
});

router.get('/:username/following', async (req, res) => {
  const prisma = req.prisma;
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: { following: { select: { id: true, username: true, displayName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ following: following.map(f => f.following) });
});

export default router;
