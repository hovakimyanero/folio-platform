import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class NotificationsService {
  static async createNotification(data) {
    const { userId, type, message, relatedId } = data;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedId,
      },
    });

    return notification;
  }

  static async getUserNotifications(userId, skip = 0, take = 20) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return notifications;
  }

  static async markAsRead(notificationId) {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return notification;
  }

  static async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId },
      data: { read: true },
    });

    return { message: 'All notifications marked as read' };
  }

  static async deleteNotification(notificationId) {
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted' };
  }

  static async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });

    return count;
  }
}
