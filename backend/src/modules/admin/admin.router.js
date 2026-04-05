import { Router } from 'express';

const router = Router();

// Admin check middleware
function adminCheck(req, res, next) {
  // userId is set by authMiddleware already applied in index.js
  // We'll verify admin status here
  req.prisma.user.findUnique({ where: { id: req.userId } }).then(user => {
    if (!user?.isAdmin) return res.status(403).json({ error: { message: 'Admin access required' } });
    next();
  });
}

router.use(adminCheck);

// ═══ REPORTS ═══

router.get('/reports', async (req, res) => {
  const { status = 'PENDING', page = 1, limit = 20 } = req.query;

  const [reports, total] = await Promise.all([
    req.prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        reporter: { select: { id: true, username: true, displayName: true, avatar: true } },
        reportedUser: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    }),
    req.prisma.report.count({ where: { status } }),
  ]);

  res.json({ reports, total });
});

router.patch('/reports/:id', async (req, res) => {
  const { status } = req.body; // RESOLVED or DISMISSED
  const report = await req.prisma.report.update({
    where: { id: req.params.id },
    data: { status, resolvedAt: new Date() },
  });
  res.json({ report });
});

// ═══ BAN USER ═══

router.post('/ban/:userId', async (req, res) => {
  const { reason } = req.body;
  await req.prisma.user.update({
    where: { id: req.params.userId },
    data: { isBanned: true },
  });
  // Invalidate all sessions
  await req.prisma.session.deleteMany({ where: { userId: req.params.userId } });

  res.json({ message: 'User banned', userId: req.params.userId });
});

router.post('/unban/:userId', async (req, res) => {
  await req.prisma.user.update({
    where: { id: req.params.userId },
    data: { isBanned: false },
  });
  res.json({ message: 'User unbanned' });
});

// ═══ FEATURE PROJECT ═══

router.patch('/projects/:id/feature', async (req, res) => {
  const { featured } = req.body;
  const project = await req.prisma.project.update({
    where: { id: req.params.id },
    data: { featured: !!featured },
  });
  res.json({ project });
});

// ═══ ANALYTICS ═══

router.get('/analytics', async (req, res) => {
  const [userCount, projectCount, totalViews, totalLikes] = await Promise.all([
    req.prisma.user.count(),
    req.prisma.project.count({ where: { published: true } }),
    req.prisma.project.aggregate({ _sum: { viewCount: true } }),
    req.prisma.project.aggregate({ _sum: { likeCount: true } }),
  ]);

  // Last 7 days signups
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsers = await req.prisma.user.count({ where: { createdAt: { gte: weekAgo } } });
  const newProjects = await req.prisma.project.count({ where: { createdAt: { gte: weekAgo } } });

  res.json({
    users: userCount,
    projects: projectCount,
    views: totalViews._sum.viewCount || 0,
    likes: totalLikes._sum.likeCount || 0,
    newUsersWeek: newUsers,
    newProjectsWeek: newProjects,
  });
});

// ═══ USERS LIST ═══

router.get('/users', async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;

  const where = search ? {
    OR: [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    req.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, username: true, displayName: true, avatar: true,
        role: true, isBanned: true, isVerified: true, createdAt: true,
        _count: { select: { projects: true, followers: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    req.prisma.user.count({ where }),
  ]);

  res.json({ users, total });
});

// ═══ CHALLENGES ═══

router.get('/challenges', async (req, res) => {
  const challenges = await req.prisma.challenge.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true } } },
  });
  res.json({ challenges });
});

router.post('/challenges', async (req, res) => {
  const { title, description, rules, deadline, cover } = req.body;
  if (!title || !description || !deadline) {
    return res.status(400).json({ error: { message: 'Title, description, and deadline are required' } });
  }
  const challenge = await req.prisma.challenge.create({
    data: {
      title,
      description,
      rules: rules || '',
      deadline: new Date(deadline),
      cover: cover || null,
      isActive: true,
    },
  });
  res.status(201).json({ challenge });
});

router.patch('/challenges/:id', async (req, res) => {
  const { title, description, rules, deadline, isActive, cover } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (rules !== undefined) data.rules = rules;
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (isActive !== undefined) data.isActive = isActive;
  if (cover !== undefined) data.cover = cover;

  const challenge = await req.prisma.challenge.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ challenge });
});

router.delete('/challenges/:id', async (req, res) => {
  // Delete entries first, then the challenge
  await req.prisma.challengeEntry.deleteMany({ where: { challengeId: req.params.id } });
  await req.prisma.challenge.delete({ where: { id: req.params.id } });
  res.json({ message: 'Challenge deleted' });
});

export default router;
