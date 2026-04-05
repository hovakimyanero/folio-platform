import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class ChallengesService {
  static async createChallenge(data) {
    const { title, description, category, difficulty, thumbnail, userId } = data;

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        category,
        difficulty,
        thumbnail,
        createdBy: userId,
      },
    });

    return challenge;
  }

  static async getChallenges(skip = 0, take = 20, filters = {}) {
    const challenges = await prisma.challenge.findMany({
      where: filters,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return challenges;
  }

  static async getChallengeById(challengeId) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return challenge;
  }

  static async updateChallenge(challengeId, userId, data) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (challenge.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data,
    });

    return updated;
  }

  static async deleteChallenge(challengeId, userId) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (challenge.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    return { message: 'Challenge deleted' };
  }
}

// ═══ Auto-select challenge winners (cron) ═══
export async function autoSelectChallengeWinners(prismaClient) {
  // Find active challenges past deadline
  const expiredChallenges = await prismaClient.challenge.findMany({
    where: { isActive: true, deadline: { lt: new Date() } },
  });

  if (expiredChallenges.length === 0) return 0;

  // Get admin user for notification actor
  const admin = await prismaClient.user.findFirst({ where: { isAdmin: true } });

  for (const challenge of expiredChallenges) {
    // Recalculate scores
    const entries = await prismaClient.challengeEntry.findMany({
      where: { challengeId: challenge.id },
      include: { project: { select: { likeCount: true, commentCount: true, viewCount: true } } },
    });

    for (const entry of entries) {
      const score = entry.project.likeCount * 2 + entry.project.commentCount * 3 + entry.project.viewCount;
      await prismaClient.challengeEntry.update({
        where: { id: entry.id },
        data: { score, isWinner: false },
      });
    }

    // Top 3 are winners
    const topEntries = await prismaClient.challengeEntry.findMany({
      where: { challengeId: challenge.id },
      orderBy: { score: 'desc' },
      take: 3,
    });

    for (const entry of topEntries) {
      await prismaClient.challengeEntry.update({
        where: { id: entry.id },
        data: { isWinner: true },
      });

      await prismaClient.notification.create({
        data: {
          type: 'CHALLENGE_WINNER',
          recipientId: entry.userId,
          actorId: admin?.id || entry.userId,
          entityType: 'challenge',
          entityId: challenge.id,
        },
      });
    }

    await prismaClient.challenge.update({
      where: { id: challenge.id },
      data: { isActive: false },
    });
  }

  return expiredChallenges.length;
}

// ═══ Bootstrap admin user on startup ═══
export async function bootstrapAdmin(prismaClient) {
  const bcrypt = await import('bcryptjs');
  const existing = await prismaClient.user.findUnique({ where: { username: 'admin' } });
  if (!existing) {
    const hash = await bcrypt.default.hash('admin', 12);
    await prismaClient.user.create({
      data: {
        email: 'admin@folio.app',
        username: 'admin',
        displayName: 'Folio Admin',
        passwordHash: hash,
        isAdmin: true,
        isVerified: true,
        role: 'DESIGNER',
      },
    });
    console.log('[BOOTSTRAP] Admin user created (admin / admin)');
  }
}
