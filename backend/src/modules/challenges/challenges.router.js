import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const challenges = await req.prisma.challenge.findMany({
    orderBy: { deadline: 'desc' },
    include: { _count: { select: { entries: true } } },
  });
  res.json({ challenges });
});

router.get('/:id', optionalAuth, async (req, res) => {
  const challenge = await req.prisma.challenge.findUnique({
    where: { id: req.params.id },
    include: {
      entries: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatar: true } },
          project: {
            include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } },
          },
        },
        orderBy: { score: 'desc' },
      },
      _count: { select: { entries: true } },
    },
  });

  if (!challenge) return res.status(404).json({ error: { message: 'Not found' } });

  let hasEntered = false;
  if (req.userId) {
    const entry = await req.prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId: req.params.id, userId: req.userId } },
    });
    hasEntered = !!entry;
  }

  res.json({ challenge: { ...challenge, hasEntered } });
});

router.post('/:id/participate', authMiddleware, async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: { message: 'Project ID required' } });

  const challenge = await req.prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge || !challenge.isActive || challenge.deadline < new Date()) {
    return res.status(400).json({ error: { message: 'Challenge is closed' } });
  }

  // Verify project belongs to user
  const project = await req.prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.authorId !== req.userId) {
    return res.status(400).json({ error: { message: 'You can only submit your own projects' } });
  }

  try {
    const entry = await req.prisma.challengeEntry.create({
      data: {
        challengeId: req.params.id,
        userId: req.userId,
        projectId,
        score: project.likeCount, // Initial score from existing likes
      },
    });
    res.status(201).json({ entry });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Already entered' } });
    res.status(500).json({ error: { message: 'Failed to enter' } });
  }
});

// Admin: Select winners (called by cron or manually)
router.post('/:id/select-winners', authMiddleware, async (req, res) => {
  const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.isAdmin) return res.status(403).json({ error: { message: 'Admin only' } });

  // Update scores from project likes
  const entries = await req.prisma.challengeEntry.findMany({
    where: { challengeId: req.params.id },
    include: { project: { select: { likeCount: true, commentCount: true, viewCount: true } } },
  });

  for (const entry of entries) {
    const score = entry.project.likeCount * 2 + entry.project.commentCount * 3 + entry.project.viewCount;
    await req.prisma.challengeEntry.update({
      where: { id: entry.id },
      data: { score, isWinner: false },
    });
  }

  // Top 3 are winners
  const topEntries = await req.prisma.challengeEntry.findMany({
    where: { challengeId: req.params.id },
    orderBy: { score: 'desc' },
    take: 3,
  });

  for (const entry of topEntries) {
    await req.prisma.challengeEntry.update({
      where: { id: entry.id },
      data: { isWinner: true },
    });

    // Notify winner
    await req.prisma.notification.create({
      data: {
        type: 'CHALLENGE_WINNER',
        recipientId: entry.userId,
        actorId: req.userId,
        entityType: 'challenge',
        entityId: req.params.id,
      },
    });
  }

  await req.prisma.challenge.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ message: 'Winners selected', winners: topEntries.length });
});

export default router;
