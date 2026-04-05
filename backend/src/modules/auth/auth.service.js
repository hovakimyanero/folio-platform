import { getPrismaClient } from '../../config/database.config.js';
import bcrypt from 'bcryptjs';

const prisma = getPrismaClient();

export class AuthService {
  static async register(data) {
    const { email, password, name, username } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username: username || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    return user;
  }

  static async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    };
  }

  static async verifyRefreshToken(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return !!user;
  }
}
