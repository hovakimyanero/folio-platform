import { Router } from 'express';
import { authMiddleware } from '../../common/auth.middleware.js';
import { shouldNotify } from '../../common/notifications.js';

const router = Router();

// ═══ REPOST PROJECT ═══
router.post('/:projectId', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { projectId } = req.params;
  const { caption } = req.body;

  try {
    await prisma.repost.create({
      data: { userId: req.userId, projectId, caption: caption || null },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { repostCount: { increment: 1 } },
    });

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (project && project.authorId !== req.userId && await shouldNotify(prisma, project.authorId, 'REPOST')) {
      await prisma.notification.create({
        data: { type: 'REPOST', recipientId: project.authorId, actorId: req.userId, entityType: 'project', entityId: projectId },
      });
      req.io?.to(project.authorId).emit('notification', { type: 'REPOST' });
    }

    res.json({ reposted: true });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Already reposted' } });
    res.status(500).json({ error: { message: 'Failed to repost' } });
  }
});

// ═══ REMOVE REPOST ═══
router.delete('/:projectId', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { projectId } = req.params;

  try {
    await prisma.repost.delete({
      where: { userId_projectId: { userId: req.userId, projectId } },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { repostCount: { decrement: 1 } },
    });
    res.json({ reposted: false });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to remove repost' } });
  }
});

export default router;
