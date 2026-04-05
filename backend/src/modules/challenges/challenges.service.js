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
