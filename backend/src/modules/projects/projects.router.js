import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';
import multer from 'multer';
import { uploadFile, getPresignedUploadUrl } from '../../common/upload.js';
import { shouldNotify } from '../../common/notifications.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ═══ PUBLIC STATS ═══

router.get('/stats', async (req, res) => {
  try {
    const [users, projects, viewsAgg] = await Promise.all([
      req.prisma.user.count(),
      req.prisma.project.count({ where: { published: true } }),
      req.prisma.project.aggregate({ _sum: { viewCount: true } }),
    ]);
    res.json({ users, projects, views: viewsAgg._sum.viewCount || 0 });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch stats' } });
  }
});

// ═══ GET CATEGORIES ═══

router.get('/categories', async (req, res) => {
  try {
    const categories = await req.prisma.category.findMany({ orderBy: { order: 'asc' } });
    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch categories' } });
  }
});

// ═══ GET PROJECTS (paginated, sorted) ═══

router.get('/', optionalAuth, async (req, res) => {
  const { sort = 'recent', category, tag, page = 1, limit = 20 } = req.query;
  const prisma = req.prisma;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { published: true };
  if (category) where.category = { slug: category };
  if (tag) where.tags = { has: tag };

  let orderBy;
  switch (sort) {
    case 'trending': orderBy = { trendScore: 'desc' }; break;
    case 'popular': orderBy = { likeCount: 'desc' }; break;
    case 'featured': where.featured = true; orderBy = { createdAt: 'desc' }; break;
    default: orderBy = { createdAt: 'desc' };
  }

  try {
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // If authenticated, check which projects are liked
    let likedIds = new Set();
    if (req.userId) {
      const likes = await prisma.like.findMany({
        where: { userId: req.userId, projectId: { in: projects.map(p => p.id) } },
        select: { projectId: true },
      });
      likedIds = new Set(likes.map(l => l.projectId));
    }

    res.json({
      projects: projects.map(p => ({
        ...p,
        isLiked: likedIds.has(p.id),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch projects' } });
  }
});

// ═══ GET SINGLE PROJECT ═══

router.get('/:id', optionalAuth, async (req, res) => {
  const prisma = req.prisma;

  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true, username: true, displayName: true, avatar: true, bio: true,
            _count: { select: { followers: true, projects: true } },
          },
        },
        media: { orderBy: { order: 'asc' } },
        category: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    // Increment view count
    await prisma.project.update({
      where: { id: project.id },
      data: { viewCount: { increment: 1 } },
    });

    // Check if liked by current user
    let isLiked = false;
    let isFollowing = false;
    if (req.userId) {
      const like = await prisma.like.findUnique({
        where: { userId_projectId: { userId: req.userId, projectId: project.id } },
      });
      isLiked = !!like;

      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.userId, followingId: project.authorId } },
      });
      isFollowing = !!follow;
    }

    // Get similar projects
    const similar = await prisma.project.findMany({
      where: {
        published: true,
        id: { not: project.id },
        OR: [
          { categoryId: project.categoryId },
          { tags: { hasSome: project.tags } },
        ],
      },
      take: 4,
      orderBy: { likeCount: 'desc' },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    // Get more from author
    const moreByAuthor = await prisma.project.findMany({
      where: { authorId: project.authorId, id: { not: project.id }, published: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      project: { ...project, isLiked, isFollowing },
      similar,
      moreByAuthor,
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch project' } });
  }
});

// ═══ PRESIGN UPLOAD URLs ═══

router.post('/presign', authMiddleware, async (req, res) => {
  const { files } = req.body; // [{ filename, contentType }]
  if (!files || !Array.isArray(files) || files.length === 0 || files.length > 20) {
    return res.status(400).json({ error: { message: 'Provide 1-20 files' } });
  }

  try {
    const results = await Promise.all(
      files.map(f => getPresignedUploadUrl(f.filename, f.contentType, `projects/${req.userId}`))
    );
    res.json({ uploads: results });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: { message: 'Failed to generate upload URLs' } });
  }
});

// ═══ CREATE PROJECT ═══

router.post('/', authMiddleware, upload.array('media', 20), async (req, res) => {
  const { title, description, tags, tools, categoryId, colors, coverIndex } = req.body;
  const prisma = req.prisma;

  if (!title) {
    return res.status(400).json({ error: { message: 'Title is required' } });
  }

  try {
    // Resolve category by name if needed
    let resolvedCategoryId = categoryId || null;
    if (categoryId && !categoryId.match(/^c[a-z0-9]{24,}$/)) {
      // categoryId is a name, find or create
      const slug = categoryId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let cat = await prisma.category.findUnique({ where: { slug } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name: categoryId, slug } });
      }
      resolvedCategoryId = cat.id;
    }

    // Upload files to S3
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadFile(file, `projects/${req.userId}`);
        mediaUrls.push({ url, type: file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE' });
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        cover: mediaUrls[parseInt(coverIndex) || 0]?.url || '',
        tags: tags ? JSON.parse(tags) : [],
        tools: tools ? JSON.parse(tools) : [],
        colors: colors ? JSON.parse(colors) : [],
        categoryId: resolvedCategoryId,
        authorId: req.userId,
        published: true,
        media: {
          create: mediaUrls.map((m, i) => ({
            url: m.url,
            type: m.type,
            order: i,
          })),
        },
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        media: true,
      },
    });

    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: { message: 'Failed to create project' } });
  }
});

// ═══ CREATE PROJECT (from pre-uploaded URLs) ═══

router.post('/create', authMiddleware, async (req, res) => {
  const { title, description, tags, tools, categoryId, colors, coverIndex, media } = req.body;
  const prisma = req.prisma;

  if (!title) {
    return res.status(400).json({ error: { message: 'Title is required' } });
  }
  if (!media || !Array.isArray(media) || media.length === 0) {
    return res.status(400).json({ error: { message: 'At least one image is required' } });
  }

  try {
    let resolvedCategoryId = categoryId || null;
    if (categoryId && !categoryId.match(/^c[a-z0-9]{24,}$/)) {
      const slug = categoryId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let cat = await prisma.category.findUnique({ where: { slug } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name: categoryId, slug } });
      }
      resolvedCategoryId = cat.id;
    }

    const idx = parseInt(coverIndex) || 0;
    const cover = media[idx]?.url || media[0]?.url || '';

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        cover,
        tags: tags || [],
        tools: tools || [],
        colors: colors || [],
        categoryId: resolvedCategoryId,
        authorId: req.userId,
        published: true,
        media: {
          create: media.map((m, i) => ({
            url: m.url,
            type: m.type || 'IMAGE',
            order: i,
          })),
        },
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        media: true,
      },
    });

    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: { message: 'Failed to create project' } });
  }
});

// ═══ UPDATE PROJECT ═══

router.patch('/:id', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { title, description, tags, tools, categoryId, published } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: { message: 'Not found' } });
    if (project.authorId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(tags && { tags: JSON.parse(tags) }),
        ...(tools && { tools: JSON.parse(tools) }),
        ...(categoryId && { categoryId }),
        ...(published !== undefined && { published }),
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, media: true },
    });

    res.json({ project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: { message: 'Failed to update project' } });
  }
});

// ═══ DELETE PROJECT ═══

router.delete('/:id', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: { message: 'Not found' } });
  if (project.authorId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: 'Project deleted' });
});

// ═══ LIKE / UNLIKE ═══

router.post('/:id/like', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  try {
    await prisma.like.create({
      data: { userId: req.userId, projectId: req.params.id },
    });
    await prisma.project.update({
      where: { id: req.params.id },
      data: { likeCount: { increment: 1 } },
    });

    // Create notification (respecting prefs)
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, select: { authorId: true } });
    if (project && project.authorId !== req.userId && await shouldNotify(prisma, project.authorId, 'LIKE')) {
      await prisma.notification.create({
        data: {
          type: 'LIKE',
          recipientId: project.authorId,
          actorId: req.userId,
          entityType: 'project',
          entityId: req.params.id,
        },
      });
      req.io?.to(project.authorId).emit('notification', { type: 'LIKE' });
    }

    res.json({ liked: true });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Already liked' } });
    res.status(500).json({ error: { message: 'Failed to like' } });
  }
});

router.delete('/:id/like', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  try {
    await prisma.like.delete({
      where: { userId_projectId: { userId: req.userId, projectId: req.params.id } },
    });
    await prisma.project.update({
      where: { id: req.params.id },
      data: { likeCount: { decrement: 1 } },
    });
    res.json({ liked: false });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to unlike' } });
  }
});

export default router;
