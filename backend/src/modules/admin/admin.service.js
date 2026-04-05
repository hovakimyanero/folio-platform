import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class AdminService {
  static async getStats() {
    const [usersCount, projectsCount, commentsCount, messagesCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.comment.count(),
      prisma.message.count(),
    ]);

    return {
      users: usersCount,
      projects: projectsCount,
      comments: commentsCount,
      messages: messagesCount,
    };
  }

  static async getUsers(skip = 0, take = 20) {
    const users = await prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  static async banUser(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned: true },
    });

    return user;
  }

  static async unbanUser(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned: false },
    });

    return user;
  }

  static async deleteUser(userId) {
    // Delete all user-related data
    await prisma.message.deleteMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    });

    await prisma.comment.deleteMany({
      where: { userId },
    });

    await prisma.like.deleteMany({
      where: { userId },
    });

    await prisma.project.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted' };
  }

  static async getReports(skip = 0, take = 20) {
    const reports = await prisma.report.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  }
}
