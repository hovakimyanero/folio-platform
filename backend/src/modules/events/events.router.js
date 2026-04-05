import { Router } from 'express';
import { optionalAuth } from '../../common/auth.middleware.js';

const router = Router();

// GET all events
router.get('/', optionalAuth, async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const prisma = req.prisma;

  try {
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.event.count(),
    ]);

    // Enrich with entity data
    const enriched = await Promise.all(events.map(async (event) => {
      let entity = null;
      if (event.entityType === 'user' && event.entityId) {
        entity = await prisma.user.findUnique({
          where: { id: event.entityId },
          select: { id: true, username: true, displayName: true, avatar: true },
        });
      } else if (event.entityType === 'project' && event.entityId) {
        entity = await prisma.project.findUnique({
          where: { id: event.entityId },
          select: { id: true, title: true, cover: true },
        });
      }
      return { ...event, entity };
    }));

    res.json({ events: enriched, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch events' } });
  }
});

export default router;
