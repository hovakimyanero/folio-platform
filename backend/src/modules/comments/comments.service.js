import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class CommentsService {
  static async createComment(data) {
    const { userId, projectId, content, parentCommentId } = data;

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        projectId,
        ...(parentCommentId && { parentCommentId }),
      },
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
    });

    return comment;
  }

  static async getProjectComments(projectId, skip = 0, take = 20) {
    const comments = await prisma.comment.findMany({
      where: {
        projectId,
        parentCommentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
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
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  static async updateComment(commentId, userId, data) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: data.content },
    });

    return updated;
  }

  static async deleteComment(commentId, userId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.comment.deleteMany({
      where: { parentCommentId: commentId },
    });

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted' };
  }
}
