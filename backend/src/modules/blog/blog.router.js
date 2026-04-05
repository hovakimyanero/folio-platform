import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

// GET all blog posts
router.get('/', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const prisma = req.prisma;

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
      }),
      prisma.blogPost.count({ where: { published: true } }),
    ]);

    res.json({ posts, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('Get blog posts error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch posts' } });
  }
});

// GET single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await req.prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch post' } });
  }
});

// CREATE post (auth required)
router.post('/', authMiddleware, async (req, res) => {
  const { title, content, excerpt, cover } = req.body;
  if (!title || !content) return res.status(400).json({ error: { message: 'Title and content are required' } });

  try {
    const post = await req.prisma.blogPost.create({
      data: {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        cover: cover || null,
        authorId: req.userId,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    res.status(201).json({ post });
  } catch (err) {
    console.error('Create blog post error:', err);
    res.status(500).json({ error: { message: 'Failed to create post' } });
  }
});

// UPDATE post
router.patch('/:id', authMiddleware, async (req, res) => {
  const { title, content, excerpt, cover, published } = req.body;
  try {
    const post = await req.prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: { message: 'Not found' } });
    if (post.authorId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

    const updated = await req.prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(cover !== undefined && { cover }),
        ...(published !== undefined && { published }),
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    res.json({ post: updated });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to update post' } });
  }
});

// DELETE post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await req.prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: { message: 'Not found' } });
    if (post.authorId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

    await req.prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to delete post' } });
  }
});

export default router;
