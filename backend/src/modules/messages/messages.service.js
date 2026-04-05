import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class MessagesService {
  static async sendMessage(data) {
    const { senderId, recipientId, content } = data;

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        recipientId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return message;
  }

  static async getConversation(userId, otherUserId, skip = 0, take = 50) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return messages;
  }

  static async getUserConversations(userId) {
    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      distinct: ['senderId', 'recipientId'],
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return conversations;
  }

  static async markAsRead(messageId) {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });

    return message;
  }

  static async deleteMessage(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (message.senderId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted' };
  }
}
