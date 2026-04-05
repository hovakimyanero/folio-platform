import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { page = 1, limit = 30 } = req.query;

  const [notifications, unreadCount] = await Promise.all([
    req.prisma.notification.findMany({
      where: { recipientId: req.userId },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    }),
    req.prisma.notification.count({
      where: { recipientId: req.userId, read: false },
    }),
  ]);

  res.json({ notifications, unreadCount });
});

router.patch('/read', async (req, res) => {
  const { ids } = req.body; // Array of notification IDs, or empty for all

  if (ids?.length) {
    await req.prisma.notification.updateMany({
      where: { id: { in: ids }, recipientId: req.userId },
      data: { read: true },
    });
  } else {
    await req.prisma.notification.updateMany({
      where: { recipientId: req.userId, read: false },
      data: { read: true },
    });
  }

  res.json({ message: 'Marked as read' });
});

export default router;
