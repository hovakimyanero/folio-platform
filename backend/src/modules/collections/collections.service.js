import { getPrismaClient } from '../../config/database.config.js';

const prisma = getPrismaClient();

export class CollectionsService {
  static async createCollection(data) {
    const { userId, name, description } = data;

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return collection;
  }

  static async getCollectionById(collectionId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
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

    return collection;
  }

  static async updateCollection(collectionId, userId, data) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (collection.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data,
    });

    return updated;
  }

  static async deleteCollection(collectionId, userId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (collection.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return { message: 'Collection deleted' };
  }

  static async addProjectToCollection(collectionId, projectId, userId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (collection.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        projects: {
          connect: { id: projectId },
        },
      },
    });

    return updated;
  }

  static async removeProjectFromCollection(collectionId, projectId, userId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (collection.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        projects: {
          disconnect: { id: projectId },
        },
      },
    });

    return updated;
  }

  static async getUserCollections(userId) {
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return collections;
  }
}
