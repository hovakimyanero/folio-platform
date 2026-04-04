import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class LikesService {
  // Add like to project or comment
  static async addLike(data) {
    const { userId, projectId, commentId } = data;

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        ...(projectId && { projectId }),
        ...(commentId && { commentId }),
      },
    });

    if (existingLike) {
      throw new Error('Already liked');
    }

    const like = await prisma.like.create({
      data: {
        userId,
        ...(projectId && { projectId }),
        ...(commentId && { commentId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return like;
  }

  // Remove like
  static async removeLike(data) {
    const { userId, projectId, commentId } = data;

    const like = await prisma.like.deleteMany({
      where: {
        userId,
        ...(projectId && { projectId }),
        ...(commentId && { commentId }),
      },
    });

    return like;
  }

  // Get likes for project
  static async getProjectLikes(projectId) {
    const likes = await prisma.like.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return likes;
  }

  // Get likes for comment
  static async getCommentLikes(commentId) {
    const likes = await prisma.like.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return likes;
  }

  // Check if user liked
  static async isLiked(userId, projectId, commentId) {
    const like = await prisma.like.findFirst({
      where: {
        userId,
        ...(projectId && { projectId }),
        ...(commentId && { commentId }),
      },
    });

    return !!like;
  }

  // Get count
  static async getLikeCount(projectId, commentId) {
    const count = await prisma.like.count({
      where: {
        ...(projectId && { projectId }),
        ...(commentId && { commentId }),
      },
    });

    return count;
  }
}
