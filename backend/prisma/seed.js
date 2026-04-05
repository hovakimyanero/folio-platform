import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categories
  const categories = [
    { name: 'UI/UX', slug: 'ui-ux', order: 1 },
    { name: 'Branding', slug: 'branding', order: 2 },
    { name: '3D & Motion', slug: '3d-motion', order: 3 },
    { name: 'Illustration', slug: 'illustration', order: 4 },
    { name: 'Web Design', slug: 'web-design', order: 5 },
    { name: 'Mobile Apps', slug: 'mobile-apps', order: 6 },
    { name: 'Typography', slug: 'typography', order: 7 },
    { name: 'Photography', slug: 'photography', order: 8 },
    { name: 'Product Design', slug: 'product-design', order: 9 },
    { name: 'Game Design', slug: 'game-design', order: 10 },
    { name: 'Architecture', slug: 'architecture', order: 11 },
    { name: 'Print', slug: 'print', order: 12 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Created ${categories.length} categories`);

  // Admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@folio.app' },
    update: {},
    create: {
      email: 'admin@folio.app',
      username: 'admin',
      displayName: 'Folio Admin',
      passwordHash: adminPassword,
      isAdmin: true,
      isVerified: true,
      role: 'DESIGNER',
    },
  });
  console.log('Admin user created (admin@folio.app / admin123456)');

  // Sample challenge
  await prisma.challenge.upsert({
    where: { id: 'seed-challenge-1' },
    update: {},
    create: {
      id: 'seed-challenge-1',
      title: 'Redesign the Future',
      description: 'Переосмыслите интерфейс любого существующего продукта с акцентом на 2030 год. Лучшие работы получат признание и продвижение на платформе.',
      rules: '1. Один проект от участника\n2. Проект должен быть оригинальным\n3. Работа должна включать минимум 3 экрана\n4. Срок подачи — до дедлайна',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      isActive: true,
    },
  });
  console.log('Sample challenge created');

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
