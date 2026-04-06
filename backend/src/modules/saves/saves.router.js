import { Router } from 'express';
import { authMiddleware } from '../../common/auth.middleware.js';
import { shouldNotify } from '../../common/notifications.js';

const router = Router();

// ═══ SAVE PROJECT ═══
router.post('/:projectId', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { projectId } = req.params;

  try {
    await prisma.save.create({
      data: { userId: req.userId, projectId },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { saveCount: { increment: 1 } },
    });

    // Notify author
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (project && project.authorId !== req.userId && await shouldNotify(prisma, project.authorId, 'SAVE')) {
      await prisma.notification.create({
        data: { type: 'SAVE', recipientId: project.authorId, actorId: req.userId, entityType: 'project', entityId: projectId },
      });
      req.io?.to(project.authorId).emit('notification', { type: 'SAVE' });
    }

    res.json({ saved: true });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Already saved' } });
    res.status(500).json({ error: { message: 'Failed to save' } });
  }
});

// ═══ UNSAVE PROJECT ═══
router.delete('/:projectId', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { projectId } = req.params;

  try {
    await prisma.save.delete({
      where: { userId_projectId: { userId: req.userId, projectId } },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { saveCount: { decrement: 1 } },
    });
    res.json({ saved: false });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to unsave' } });
  }
});

// ═══ GET MY SAVES ═══
router.get('/', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [saves, total] = await Promise.all([
      prisma.save.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          project: {
            include: {
              author: { select: { id: true, username: true, displayName: true, avatar: true } },
              _count: { select: { likes: true, comments: true, saves: true } },
            },
          },
        },
      }),
      prisma.save.count({ where: { userId: req.userId } }),
    ]);

    res.json({
      saves: saves.map(s => ({ ...s.project, savedAt: s.createdAt })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch saves' } });
  }
});

export default router;
