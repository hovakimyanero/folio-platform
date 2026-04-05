import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

// GET all jobs
router.get('/', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const prisma = req.prisma;
  const where = { published: true };
  if (type) where.type = type;

  try {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ jobs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch jobs' } });
  }
});

// GET single job
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await req.prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch job' } });
  }
});

// CREATE job (auth required)
router.post('/', authMiddleware, async (req, res) => {
  const { title, company, location, type, description, salary, contactEmail, contactUrl } = req.body;
  if (!title || !company || !description) return res.status(400).json({ error: { message: 'Title, company and description are required' } });

  try {
    const job = await req.prisma.job.create({
      data: {
        title,
        company,
        location: location || null,
        type: type || 'FULL_TIME',
        description,
        salary: salary || null,
        contactEmail: contactEmail || null,
        contactUrl: contactUrl || null,
        authorId: req.userId,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    res.status(201).json({ job });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: { message: 'Failed to create job' } });
  }
});

// DELETE job
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await req.prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: { message: 'Not found' } });
    if (job.authorId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

    await req.prisma.job.delete({ where: { id: req.params.id } });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to delete job' } });
  }
});

export default router;
