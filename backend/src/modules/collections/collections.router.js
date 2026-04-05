import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  const where = req.userId
    ? { OR: [{ isPrivate: false }, { userId: req.userId }] }
    : { isPrivate: false };

  const collections = await req.prisma.collection.findMany({
    where,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ collections });
});

router.get('/:id', optionalAuth, async (req, res) => {
  const collection = await req.prisma.collection.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      items: {
        include: {
          project: {
            include: {
              author: { select: { id: true, username: true, displayName: true, avatar: true } },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!collection) return res.status(404).json({ error: { message: 'Not found' } });
  if (collection.isPrivate && collection.userId !== req.userId) {
    return res.status(403).json({ error: { message: 'Private collection' } });
  }

  res.json({ collection });
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, description, isPrivate } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: { message: 'Name required' } });

  const collection = await req.prisma.collection.create({
    data: { name: name.trim(), description, isPrivate: !!isPrivate, userId: req.userId },
  });
  res.status(201).json({ collection });
});

router.post('/:id/projects', authMiddleware, async (req, res) => {
  const { projectId } = req.body;
  const collection = await req.prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!collection || collection.userId !== req.userId) {
    return res.status(403).json({ error: { message: 'Not authorized' } });
  }

  try {
    await req.prisma.collectionItem.create({
      data: { collectionId: req.params.id, projectId },
    });

    // Update cover to latest project
    const project = await req.prisma.project.findUnique({ where: { id: projectId }, select: { cover: true } });
    if (project) {
      await req.prisma.collection.update({ where: { id: req.params.id }, data: { cover: project.cover } });
    }

    res.json({ message: 'Added' });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Already in collection' } });
    res.status(500).json({ error: { message: 'Failed to add' } });
  }
});

router.delete('/:id/projects/:projectId', authMiddleware, async (req, res) => {
  const collection = await req.prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!collection || collection.userId !== req.userId) {
    return res.status(403).json({ error: { message: 'Not authorized' } });
  }

  await req.prisma.collectionItem.deleteMany({
    where: { collectionId: req.params.id, projectId: req.params.projectId },
  });
  res.json({ message: 'Removed' });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const collection = await req.prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!collection || collection.userId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });
  await req.prisma.collection.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
