import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

// ═══ AUTOCOMPLETE TAGS ═══
router.get('/autocomplete', async (req, res) => {
  const prisma = req.prisma;
  const { q = '', limit = 10 } = req.query;

  if (q.length < 1) return res.json({ tags: [] });

  try {
    const tags = await prisma.tag.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      orderBy: { useCount: 'desc' },
      take: parseInt(limit),
      include: { parent: { select: { name: true } } },
    });
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to search tags' } });
  }
});

// ═══ GET POPULAR TAGS ═══
router.get('/popular', async (req, res) => {
  const prisma = req.prisma;
  const { limit = 30 } = req.query;

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { useCount: 'desc' },
      take: parseInt(limit),
      include: { _count: { select: { subscribers: true } } },
    });
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch tags' } });
  }
});

// ═══ GET TAG HIERARCHY ═══
router.get('/tree', async (req, res) => {
  const prisma = req.prisma;

  try {
    const tags = await prisma.tag.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: { children: true },
          orderBy: { useCount: 'desc' },
        },
      },
      orderBy: { useCount: 'desc' },
    });
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch tag tree' } });
  }
});

// ═══ GET PROJECTS BY TAG ═══
router.get('/:slug', optionalAuth, async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 20, sort = 'trending' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const tag = await prisma.tag.findUnique({ where: { slug: req.params.slug } });
    if (!tag) return res.status(404).json({ error: { message: 'Tag not found' } });

    const where = { published: true, tags: { has: tag.name } };
    let orderBy;
    switch (sort) {
      case 'popular': orderBy = { likeCount: 'desc' }; break;
      case 'recent': orderBy = { createdAt: 'desc' }; break;
      default: orderBy = { trendScore: 'desc' };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    let isSubscribed = false;
    if (req.userId) {
      const sub = await prisma.tagSubscription.findUnique({
        where: { userId_tagId: { userId: req.userId, tagId: tag.id } },
      });
      isSubscribed = !!sub;
    }

    res.json({
      tag: { ...tag, isSubscribed },
      projects,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch tag projects' } });
  }
});

// ═══ SUBSCRIBE TO TAG ═══
router.post('/:slug/subscribe', authMiddleware, async (req, res) => {
  const prisma = req.prisma;

  try {
    const tag = await prisma.tag.findUnique({ where: { slug: req.params.slug } });
    if (!tag) return res.status(404).json({ error: { message: 'Tag not found' } });

    await prisma.tagSubscription.create({
      data: { userId: req.userId, tagId: tag.id },
    });
    res.json({ subscribed: true });
  } catch (err) {
    if (err.code === 'P2002') return res.json({ subscribed: true });
    res.status(500).json({ error: { message: 'Failed to subscribe' } });
  }
});

router.delete('/:slug/subscribe', authMiddleware, async (req, res) => {
  const prisma = req.prisma;

  try {
    const tag = await prisma.tag.findUnique({ where: { slug: req.params.slug } });
    if (!tag) return res.status(404).json({ error: { message: 'Tag not found' } });

    await prisma.tagSubscription.deleteMany({
      where: { userId: req.userId, tagId: tag.id },
    });
    res.json({ subscribed: false });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to unsubscribe' } });
  }
});

// ═══ ENSURE TAG EXISTS (helper for project creation) ═══
export async function ensureTags(prisma, tagNames) {
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await prisma.tag.upsert({
      where: { slug },
      create: { name, slug, useCount: 1 },
      update: { useCount: { increment: 1 } },
    });
  }
}

export default router;
