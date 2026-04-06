import { Router } from 'express';
import { authMiddleware } from '../../common/auth.middleware.js';

const router = Router();

// ═══ GET MY ANALYTICS OVERVIEW ═══
router.get('/overview', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { period = '30d' } = req.query;

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  try {
    // Total stats
    const projects = await prisma.project.findMany({
      where: { authorId: req.userId, published: true },
      select: { id: true, viewCount: true, likeCount: true, commentCount: true, saveCount: true, repostCount: true, createdAt: true },
    });

    const totalViews = projects.reduce((s, p) => s + p.viewCount, 0);
    const totalLikes = projects.reduce((s, p) => s + p.likeCount, 0);
    const totalComments = projects.reduce((s, p) => s + p.commentCount, 0);
    const totalSaves = projects.reduce((s, p) => s + p.saveCount, 0);
    const totalReposts = projects.reduce((s, p) => s + p.repostCount, 0);

    // Followers growth
    const [followersTotal, followersNew] = await Promise.all([
      prisma.follow.count({ where: { followingId: req.userId } }),
      prisma.follow.count({ where: { followingId: req.userId, createdAt: { gte: since } } }),
    ]);

    // Profile views
    const [profileViewsTotal, profileViewsRecent] = await Promise.all([
      prisma.profileView.count({ where: { viewedId: req.userId } }),
      prisma.profileView.count({ where: { viewedId: req.userId, createdAt: { gte: since } } }),
    ]);

    // Top projects
    const topProjects = [...projects]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);

    // Engagement rate (likes + saves + comments / views)
    const engagementRate = totalViews > 0
      ? ((totalLikes + totalSaves + totalComments) / totalViews * 100).toFixed(1)
      : 0;

    // Traffic sources (from profile views)
    const referrers = await prisma.profileView.groupBy({
      by: ['referrer'],
      where: { viewedId: req.userId, createdAt: { gte: since }, referrer: { not: null } },
      _count: true,
      orderBy: { _count: { referrer: 'desc' } },
      take: 10,
    });

    // Daily views chart (last N days)
    const dailyViews = await prisma.projectView.groupBy({
      by: ['createdAt'],
      where: {
        projectId: { in: projects.map(p => p.id) },
        createdAt: { gte: since },
      },
      _count: true,
    });

    res.json({
      overview: {
        totalViews,
        totalLikes,
        totalComments,
        totalSaves,
        totalReposts,
        followersTotal,
        followersNew,
        profileViewsTotal,
        profileViewsRecent,
        engagementRate: parseFloat(engagementRate),
        projectCount: projects.length,
      },
      topProjects,
      trafficSources: referrers.map(r => ({ source: r.referrer || 'Direct', count: r._count })),
      period: periodDays,
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch analytics' } });
  }
});

// ═══ PROJECT ANALYTICS ═══
router.get('/project/:id', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { period = '30d' } = req.query;
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { id: true, authorId: true, viewCount: true, likeCount: true, commentCount: true, saveCount: true, repostCount: true, createdAt: true },
    });

    if (!project) return res.status(404).json({ error: { message: 'Not found' } });
    if (project.authorId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

    // Recent views
    const recentViews = await prisma.projectView.count({
      where: { projectId: project.id, createdAt: { gte: since } },
    });

    // Recent likes
    const recentLikes = await prisma.like.count({
      where: { projectId: project.id, createdAt: { gte: since } },
    });

    // Recent saves
    const recentSaves = await prisma.save.count({
      where: { projectId: project.id, createdAt: { gte: since } },
    });

    res.json({
      project: {
        ...project,
        recentViews,
        recentLikes,
        recentSaves,
      },
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch project analytics' } });
  }
});

export default router;
