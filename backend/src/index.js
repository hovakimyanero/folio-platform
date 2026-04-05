import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import { PrismaClient } from '@prisma/client';
import authRouter from './modules/auth/auth.router.js';
import usersRouter from './modules/users/users.router.js';
import projectsRouter from './modules/projects/projects.router.js';
import commentsRouter from './modules/comments/comments.router.js';
import collectionsRouter from './modules/collections/collections.router.js';
import challengesRouter from './modules/challenges/challenges.router.js';
import likesRouter from './modules/likes/likes.router.js';
import messagesRouter from './modules/messages/messages.router.js';
import notificationsRouter from './modules/notifications/notifications.router.js';
import adminRouter from './modules/admin/admin.router.js';
import blogRouter from './modules/blog/blog.router.js';
import eventsRouter from './modules/events/events.router.js';
import jobsRouter from './modules/jobs/jobs.router.js';
import { updateTrendScores } from './modules/projects/projects.service.js';
import { autoSelectChallengeWinners, bootstrapAdmin } from './modules/challenges/challenges.service.js';
import { authMiddleware } from './common/auth.middleware.js';
import { socketHandler } from './modules/messages/socket.handler.js';

const prisma = new PrismaClient();
const app = express();
const server = createServer(app);

// ═══ Allowed origins ═══
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/+$/, ''))
  : [];

// ═══ Socket.io ═══
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

socketHandler(io, prisma);

// ═══ Middleware ═══
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
});
app.use('/api/', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});
app.use('/api/auth/', authLimiter);

// ═══ Make prisma available ═══
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// ═══ Routes ═══
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/likes', authMiddleware, likesRouter);
app.use('/api/messages', authMiddleware, messagesRouter);
app.use('/api/notifications', authMiddleware, notificationsRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/blog', blogRouter);
app.use('/api/events', eventsRouter);
app.use('/api/jobs', jobsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ═══ Error handler ═══
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    },
  });
});

// ═══ Cron: Update trend scores every 10 minutes ═══
cron.schedule('*/10 * * * *', async () => {
  try {
    await updateTrendScores(prisma);
    console.log('[CRON] Trend scores updated');
  } catch (err) {
    console.error('[CRON] Error updating trends:', err);
  }
});

// ═══ Cron: Auto-select challenge winners every hour ═══
cron.schedule('0 * * * *', async () => {
  try {
    const count = await autoSelectChallengeWinners(prisma);
    if (count > 0) console.log(`[CRON] Auto-selected winners for ${count} challenges`);
  } catch (err) {
    console.error('[CRON] Error selecting challenge winners:', err);
  }
});

// ═══ Bootstrap admin user ═══
bootstrapAdmin(prisma).catch(err => console.error('[BOOTSTRAP] Admin error:', err));

// ═══ Start ═══
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
