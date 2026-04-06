import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

// ═══ FOR YOU (algorithmic feed) ═══
router.get('/for-you', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Get user's interests from interactions
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        project: { select: { tags: true, categoryId: true, authorId: true, tools: true } },
      },
    });

    // Build interest profile
    const tagScores = {};
    const categoryScores = {};
    const authorScores = {};

    for (const interaction of recentInteractions) {
      const weight = interaction.type === 'DWELL' ? interaction.value / 30 : // normalize dwell
                     interaction.type === 'SCROLL' ? interaction.value * 2 :
                     interaction.type === 'PROFILE_CLICK' ? 3 :
                     interaction.type === 'SHARE' ? 5 : 1;

      for (const tag of (interaction.project?.tags || [])) {
        tagScores[tag] = (tagScores[tag] || 0) + weight;
      }
      if (interaction.project?.categoryId) {
        categoryScores[interaction.project.categoryId] = (categoryScores[interaction.project.categoryId] || 0) + weight;
      }
      if (interaction.project?.authorId) {
        authorScores[interaction.project.authorId] = (authorScores[interaction.project.authorId] || 0) + weight;
      }
    }

    // Get followed authors
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followedIds = follows.map(f => f.followingId);

    // Get subscribed tags and categories
    const [tagSubs, catSubs] = await Promise.all([
      prisma.tagSubscription.findMany({ where: { userId: req.userId }, select: { tag: { select: { name: true } } } }),
      prisma.categorySubscription.findMany({ where: { userId: req.userId }, select: { categoryId: true } }),
    ]);
    const subscribedTags = tagSubs.map(t => t.tag.name);
    const subscribedCats = catSubs.map(c => c.categoryId);

    // Get top interest tags and categories
    const topTags = Object.entries(tagScores).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
    const topCats = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);

    const allTags = [...new Set([...topTags, ...subscribedTags])];
    const allCats = [...new Set([...topCats, ...subscribedCats])];

    // Seen project IDs (don't repeat)
    const seenIds = recentInteractions.map(i => i.projectId);

    // Build query with signals
    const where = {
      published: true,
      id: { notIn: seenIds.slice(0, 100) },
      authorId: { not: req.userId },
    };

    // Get candidates: mix of personalized + trending + new
    const [personalized, trending, fresh] = await Promise.all([
      // Personalized: based on interests
      prisma.project.findMany({
        where: {
          ...where,
          OR: [
            ...(allTags.length ? [{ tags: { hasSome: allTags } }] : []),
            ...(allCats.length ? [{ categoryId: { in: allCats } }] : []),
            ...(followedIds.length ? [{ authorId: { in: followedIds } }] : []),
          ].length ? [
            ...(allTags.length ? [{ tags: { hasSome: allTags } }] : []),
            ...(allCats.length ? [{ categoryId: { in: allCats } }] : []),
            ...(followedIds.length ? [{ authorId: { in: followedIds } }] : []),
          ] : [{ published: true }],
        },
        orderBy: { trendScore: 'desc' },
        take: Math.ceil(parseInt(limit) * 0.6),
        skip: Math.ceil(skip * 0.6),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      }),
      // Trending globally
      prisma.project.findMany({
        where,
        orderBy: { trendScore: 'desc' },
        take: Math.ceil(parseInt(limit) * 0.25),
        skip: Math.ceil(skip * 0.25),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      }),
      // Fresh content from new creators
      prisma.project.findMany({
        where: { ...where, author: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(parseInt(limit) * 0.15),
        skip: Math.ceil(skip * 0.15),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      }),
    ]);

    // Merge and deduplicate
    const seen = new Set();
    const merged = [...personalized, ...trending, ...fresh].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, parseInt(limit));

    // Check liked/saved status
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: { userId: req.userId, projectId: { in: merged.map(p => p.id) } },
        select: { projectId: true },
      }),
      prisma.save.findMany({
        where: { userId: req.userId, projectId: { in: merged.map(p => p.id) } },
        select: { projectId: true },
      }),
    ]);
    const likedIds = new Set(likes.map(l => l.projectId));
    const savedIds = new Set(saves.map(s => s.projectId));

    res.json({
      projects: merged.map(p => ({ ...p, isLiked: likedIds.has(p.id), isSaved: savedIds.has(p.id) })),
      pagination: { page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error('For-you feed error:', err);
    res.status(500).json({ error: { message: 'Failed to load feed' } });
  }
});

// ═══ FOLLOWING FEED ═══
router.get('/following', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followedIds = follows.map(f => f.followingId);

    if (!followedIds.length) {
      return res.json({ projects: [], pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 } });
    }

    const where = { published: true, authorId: { in: followedIds } };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const [likes, saves] = await Promise.all([
      prisma.like.findMany({ where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } }, select: { projectId: true } }),
      prisma.save.findMany({ where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } }, select: { projectId: true } }),
    ]);
    const likedIds = new Set(likes.map(l => l.projectId));
    const savedIds = new Set(saves.map(s => s.projectId));

    res.json({
      projects: projects.map(p => ({ ...p, isLiked: likedIds.has(p.id), isSaved: savedIds.has(p.id) })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Following feed error:', err);
    res.status(500).json({ error: { message: 'Failed to load feed' } });
  }
});

// ═══ TRENDING FEED ═══
router.get('/trending', optionalAuth, async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 20, period = '7d' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const periodMap = { '24h': 1, '7d': 7, '30d': 30, 'all': 365 * 10 };
  const days = periodMap[period] || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where = { published: true, createdAt: { gte: since } };

  try {
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { trendScore: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    let likedIds = new Set();
    let savedIds = new Set();
    if (req.userId) {
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({ where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } }, select: { projectId: true } }),
        prisma.save.findMany({ where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } }, select: { projectId: true } }),
      ]);
      likedIds = new Set(likes.map(l => l.projectId));
      savedIds = new Set(saves.map(s => s.projectId));
    }

    res.json({
      projects: projects.map(p => ({ ...p, isLiked: likedIds.has(p.id), isSaved: savedIds.has(p.id) })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Trending feed error:', err);
    res.status(500).json({ error: { message: 'Failed to load feed' } });
  }
});

// ═══ TRACK INTERACTION ═══
router.post('/interaction', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { projectId, type, value } = req.body;

  if (!projectId || !type) return res.status(400).json({ error: { message: 'projectId and type required' } });

  const validTypes = ['VIEW', 'DWELL', 'SCROLL', 'PROFILE_CLICK', 'SHARE'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: { message: 'Invalid interaction type' } });

  try {
    await prisma.userInteraction.create({
      data: {
        userId: req.userId,
        projectId,
        type,
        value: parseFloat(value) || 1,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to track interaction' } });
  }
});

// ═══ NEW & NOTEWORTHY (rising designers) ═══
router.get('/discover', optionalAuth, async (req, res) => {
  const prisma = req.prisma;
  const { section = 'new', page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    let projects, total;

    if (section === 'new') {
      // Projects from users who joined recently (30 days) with traction
      const where = {
        published: true,
        author: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        likeCount: { gte: 1 },
      };
      [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          orderBy: { trendScore: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true, createdAt: true } },
            category: { select: { name: true, slug: true } },
            _count: { select: { likes: true, comments: true, saves: true } },
          },
        }),
        prisma.project.count({ where }),
      ]);
    } else if (section === 'underrated') {
      // Good projects with low views but high engagement
      const where = {
        published: true,
        viewCount: { lt: 100 },
        likeCount: { gte: 3 },
      };
      [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          orderBy: { likeCount: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
            category: { select: { name: true, slug: true } },
            _count: { select: { likes: true, comments: true, saves: true } },
          },
        }),
        prisma.project.count({ where }),
      ]);
    } else {
      // Rising: biggest trend score growth in past 7 days
      const where = { published: true, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
      [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          orderBy: { trendScore: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true, level: true } },
            category: { select: { name: true, slug: true } },
            _count: { select: { likes: true, comments: true, saves: true } },
          },
        }),
        prisma.project.count({ where }),
      ]);
    }

    let likedIds = new Set(), savedIds = new Set();
    if (req.userId) {
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({ where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } }, select: { projectId: true } }),
        prisma.save.findMany({ where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } }, select: { projectId: true } }),
      ]);
      likedIds = new Set(likes.map(l => l.projectId));
      savedIds = new Set(saves.map(s => s.projectId));
    }

    res.json({
      projects: projects.map(p => ({ ...p, isLiked: likedIds.has(p.id), isSaved: savedIds.has(p.id) })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Discover feed error:', err);
    res.status(500).json({ error: { message: 'Failed to load discover' } });
  }
});

// ═══ WEEKLY PICKS ═══
router.get('/weekly-picks', optionalAuth, async (req, res) => {
  const prisma = req.prisma;
  const { week, year } = req.query;

  const now = new Date();
  const currentWeek = parseInt(week) || getISOWeek(now);
  const currentYear = parseInt(year) || now.getFullYear();

  try {
    const picks = await prisma.weeklyPick.findMany({
      where: { week: currentWeek, year: currentYear },
      include: {
        project: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true } },
            category: { select: { name: true, slug: true } },
            _count: { select: { likes: true, comments: true, saves: true } },
          },
        },
        curator: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ picks, week: currentWeek, year: currentYear });
  } catch (err) {
    console.error('Weekly picks error:', err);
    res.status(500).json({ error: { message: 'Failed to load weekly picks' } });
  }
});

function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export default router;
