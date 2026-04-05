import { Router } from 'express';

const router = Router();

// Get conversations list
router.get('/', async (req, res) => {
  const prisma = req.prisma;

  // Get unique conversations
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatar: true } },
      receiver: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  // Group by conversation partner
  const convos = new Map();
  for (const msg of messages) {
    const partnerId = msg.senderId === req.userId ? msg.receiverId : msg.senderId;
    if (!convos.has(partnerId)) {
      const partner = msg.senderId === req.userId ? msg.receiver : msg.sender;
      const unread = await prisma.message.count({
        where: { senderId: partnerId, receiverId: req.userId, read: false },
      });
      convos.set(partnerId, { partner, lastMessage: msg, unread });
    }
  }

  res.json({ conversations: Array.from(convos.values()) });
});

// Get messages with specific user
router.get('/:userId', async (req, res) => {
  const prisma = req.prisma;
  const { page = 1, limit = 50 } = req.query;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  // Mark as read
  await prisma.message.updateMany({
    where: { senderId: req.params.userId, receiverId: req.userId, read: false },
    data: { read: true },
  });

  res.json({ messages: messages.reverse() });
});

// Send message
router.post('/:userId', async (req, res) => {
  const { content, fileUrl, fileName } = req.body;
  if (!content?.trim() && !fileUrl) return res.status(400).json({ error: { message: 'Content required' } });

  const message = await req.prisma.message.create({
    data: {
      content: content?.trim() || '',
      fileUrl,
      fileName,
      senderId: req.userId,
      receiverId: req.params.userId,
    },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  // Emit via WebSocket
  req.io?.to(req.params.userId).emit('message', message);

  res.status(201).json({ message });
});

export default router;
