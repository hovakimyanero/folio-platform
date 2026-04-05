import { getPrismaClient } from '../../config/database.config.js';
import bcrypt from 'bcryptjs';

const prisma = getPrismaClient();

export class UsersService {
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        avatar: true,
        banner: true,
        website: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async getUserByUsername(username) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        website: true,
        location: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async updateProfile(userId, data) {
    const { name, bio, website, location, avatar, banner } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(website && { website }),
        ...(location && { location }),
        ...(avatar && { avatar }),
        ...(banner && { banner }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        banner: true,
        website: true,
        location: true,
      },
    });

    return user;
  }

  static async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed' };
  }

  static async followUser(userId, targetUserId) {
    if (userId === targetUserId) {
      throw new Error('Cannot follow yourself');
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return follow;
  }

  static async unfollowUser(userId, targetUserId) {
    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    return { message: 'Unfollowed' };
  }

  static async getFollowers(userId) {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return followers;
  }

  static async getFollowing(userId) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return following;
  }
}
