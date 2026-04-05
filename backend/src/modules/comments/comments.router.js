// ═══ COMMENTS ROUTER ═══
import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';
import { shouldNotify } from '../../common/notifications.js';

const router = Router();

router.get('/projects/:projectId/comments', async (req, res) => {
  const comments = await req.prisma.comment.findMany({
    where: { projectId: req.params.projectId, parentId: null },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      replies: {
        include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ comments });
});

router.post('/projects/:projectId/comments', authMiddleware, async (req, res) => {
  const { content, parentId } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: { message: 'Content required' } });

  const comment = await req.prisma.comment.create({
    data: {
      content: content.trim(),
      userId: req.userId,
      projectId: req.params.projectId,
      parentId: parentId || null,
    },
    include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
  });

  await req.prisma.project.update({
    where: { id: req.params.projectId },
    data: { commentCount: { increment: 1 } },
  });

  // Notification (respecting prefs)
  const project = await req.prisma.project.findUnique({ where: { id: req.params.projectId }, select: { authorId: true } });
  if (project && project.authorId !== req.userId && await shouldNotify(req.prisma, project.authorId, 'COMMENT')) {
    await req.prisma.notification.create({
      data: { type: 'COMMENT', recipientId: project.authorId, actorId: req.userId, entityType: 'project', entityId: req.params.projectId },
    });
    req.io?.to(project.authorId).emit('notification', { type: 'COMMENT' });
  }

  res.status(201).json({ comment });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const comment = await req.prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment) return res.status(404).json({ error: { message: 'Not found' } });
  if (comment.userId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

  await req.prisma.comment.delete({ where: { id: req.params.id } });
  await req.prisma.project.update({
    where: { id: comment.projectId },
    data: { commentCount: { decrement: 1 } },
  });
  res.json({ message: 'Deleted' });
});

export default router;
