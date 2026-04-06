import { Router } from 'express';
import { authMiddleware } from '../../common/auth.middleware.js';
import { getPresignedUploadUrl } from '../../common/upload.js';

const router = Router();

// ═══ GET MARKETPLACE ITEMS ═══
router.get('/', async (req, res) => {
  const prisma = req.prisma;
  const { type, sort = 'recent', page = 1, limit = 20, q } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { published: true };
  if (type) where.type = type;
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { tags: { hasSome: [q] } },
  ];

  let orderBy;
  switch (sort) {
    case 'popular': orderBy = { downloads: 'desc' }; break;
    case 'price_low': orderBy = { price: 'asc' }; break;
    case 'price_high': orderBy = { price: 'desc' }; break;
    case 'rating': orderBy = { rating: 'desc' }; break;
    default: orderBy = { createdAt: 'desc' };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.marketplaceItem.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          seller: { select: { id: true, username: true, displayName: true, avatar: true, isPro: true } },
          _count: { select: { purchases: true } },
        },
      }),
      prisma.marketplaceItem.count({ where }),
    ]);

    res.json({
      items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch marketplace items' } });
  }
});

// ═══ GET SINGLE ITEM ═══
router.get('/:id', async (req, res) => {
  const prisma = req.prisma;

  try {
    const item = await prisma.marketplaceItem.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, username: true, displayName: true, avatar: true, bio: true, isPro: true } },
        _count: { select: { purchases: true } },
      },
    });

    if (!item) return res.status(404).json({ error: { message: 'Item not found' } });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch item' } });
  }
});

// ═══ CREATE ITEM ═══
router.post('/', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { title, description, price, type, tags, cover, files, previews } = req.body;

  if (!title || !description || price == null || !type || !cover) {
    return res.status(400).json({ error: { message: 'Missing required fields' } });
  }

  try {
    const item = await prisma.marketplaceItem.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        type,
        tags: tags || [],
        cover,
        files: files || [],
        previews: previews || [],
        sellerId: req.userId,
      },
      include: {
        seller: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    console.error('Create marketplace item error:', err);
    res.status(500).json({ error: { message: 'Failed to create item' } });
  }
});

// ═══ UPDATE ITEM ═══
router.patch('/:id', authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const { title, description, price, tags, published } = req.body;

  try {
    const item = await prisma.marketplaceItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: { message: 'Not found' } });
    if (item.sellerId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

    const updated = await prisma.marketplaceItem.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price != null && { price: parseFloat(price) }),
        ...(tags && { tags }),
        ...(published !== undefined && { published }),
      },
    });

    res.json({ item: updated });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to update item' } });
  }
});

// ═══ DELETE ITEM ═══
router.delete('/:id', authMiddleware, async (req, res) => {
  const prisma = req.prisma;

  const item = await prisma.marketplaceItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: { message: 'Not found' } });
  if (item.sellerId !== req.userId) return res.status(403).json({ error: { message: 'Not authorized' } });

  await prisma.marketplaceItem.delete({ where: { id: req.params.id } });
  res.json({ deleted: true });
});

// ═══ PRESIGN UPLOAD ═══
router.post('/presign', authMiddleware, async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || !files.length) {
    return res.status(400).json({ error: { message: 'Provide files' } });
  }

  try {
    const results = await Promise.all(
      files.map(f => getPresignedUploadUrl(f.filename, f.contentType, `marketplace/${req.userId}`))
    );
    res.json({ uploads: results });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to generate upload URLs' } });
  }
});

export default router;
