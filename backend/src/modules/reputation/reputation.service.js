// Reputation system: calculates user levels, consistency scores, and awards badges

// Level thresholds based on reputation score
const LEVEL_THRESHOLDS = {
  NEWCOMER: 0,
  RISING: 50,
  ESTABLISHED: 200,
  TOP: 500,
  LEGEND: 1000,
};

export async function updateReputationScores(prisma) {
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    select: {
      id: true,
      createdAt: true,
      featuredCount: true,
      _count: {
        select: {
          projects: true,
          followers: true,
          likes: true,
        },
      },
    },
  });

  const updates = [];

  for (const user of users) {
    // Get aggregate project stats
    const projectStats = await prisma.project.aggregate({
      where: { authorId: user.id, published: true },
      _sum: { likeCount: true, viewCount: true, saveCount: true, commentCount: true },
    });

    const totalLikes = projectStats._sum.likeCount || 0;
    const totalViews = projectStats._sum.viewCount || 0;
    const totalSaves = projectStats._sum.saveCount || 0;
    const totalComments = projectStats._sum.commentCount || 0;

    // Reputation formula
    const reputation =
      totalLikes * 1 +
      totalSaves * 3 +   // saves are most valuable signal
      totalComments * 2 +
      totalViews * 0.01 +
      user._count.followers * 5 +
      user.featuredCount * 50 +
      user._count.projects * 2;

    // Consistency: how often they publish (projects per month)
    const accountAgeDays = Math.max(1, (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const accountAgeMonths = Math.max(1, accountAgeDays / 30);
    const consistency = Math.min(100, (user._count.projects / accountAgeMonths) * 20);

    // Determine level
    let level = 'NEWCOMER';
    for (const [lvl, threshold] of Object.entries(LEVEL_THRESHOLDS).reverse()) {
      if (reputation >= threshold) {
        level = lvl;
        break;
      }
    }

    updates.push(
      prisma.user.update({
        where: { id: user.id },
        data: {
          reputationScore: Math.round(reputation * 100) / 100,
          consistencyScore: Math.round(consistency * 100) / 100,
          level,
        },
      })
    );
  }

  // Batch in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    await prisma.$transaction(updates.slice(i, i + 50));
  }

  return updates.length;
}

// Default badges to seed
export const DEFAULT_BADGES = [
  { name: 'First Project', slug: 'first-project', description: 'Published your first project', icon: '🎨', criteria: { type: 'projects', threshold: 1 } },
  { name: 'Portfolio Builder', slug: 'portfolio-builder', description: 'Published 10 projects', icon: '📁', criteria: { type: 'projects', threshold: 10 } },
  { name: 'Popular Creator', slug: 'popular-creator', description: 'Received 100 likes total', icon: '❤️', criteria: { type: 'likes', threshold: 100 } },
  { name: 'Crowd Favorite', slug: 'crowd-favorite', description: 'Received 500 likes total', icon: '🔥', criteria: { type: 'likes', threshold: 500 } },
  { name: 'Community Builder', slug: 'community-builder', description: 'Gained 50 followers', icon: '👥', criteria: { type: 'followers', threshold: 50 } },
  { name: 'Influencer', slug: 'influencer', description: 'Gained 200 followers', icon: '⭐', criteria: { type: 'followers', threshold: 200 } },
  { name: 'Curator', slug: 'curator', description: 'Saved 50 projects', icon: '📌', criteria: { type: 'saves_given', threshold: 50 } },
  { name: 'Consistent Creator', slug: 'consistent-creator', description: 'Published projects 4 weeks in a row', icon: '📅', criteria: { type: 'consistency', threshold: 4 } },
  { name: 'Editor\'s Choice', slug: 'editors-choice', description: 'Featured by the editorial team', icon: '🏆', criteria: { type: 'featured', threshold: 1 } },
  { name: 'Top Creator', slug: 'top-creator', description: 'Reached TOP level', icon: '💎', criteria: { type: 'level', threshold: 'TOP' } },
];

export async function checkAndAwardBadges(prisma) {
  // Ensure badges exist
  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      create: badge,
      update: {},
    });
  }

  const badges = await prisma.badge.findMany();
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    select: {
      id: true,
      level: true,
      featuredCount: true,
      _count: { select: { projects: true, followers: true, likes: true, saves: true } },
      badges: { select: { badgeId: true } },
    },
  });

  let awarded = 0;

  for (const user of users) {
    const existingBadgeIds = new Set(user.badges.map(b => b.badgeId));

    // Get total likes received
    const likeStats = await prisma.project.aggregate({
      where: { authorId: user.id },
      _sum: { likeCount: true },
    });
    const totalLikesReceived = likeStats._sum.likeCount || 0;

    for (const badge of badges) {
      if (existingBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria;
      if (!criteria) continue;

      let earned = false;

      switch (criteria.type) {
        case 'projects':
          earned = user._count.projects >= criteria.threshold;
          break;
        case 'likes':
          earned = totalLikesReceived >= criteria.threshold;
          break;
        case 'followers':
          earned = user._count.followers >= criteria.threshold;
          break;
        case 'saves_given':
          earned = user._count.saves >= criteria.threshold;
          break;
        case 'featured':
          earned = user.featuredCount >= criteria.threshold;
          break;
        case 'level':
          earned = user.level === criteria.threshold;
          break;
      }

      if (earned) {
        await prisma.userBadge.create({
          data: { userId: user.id, badgeId: badge.id },
        }).catch(() => {}); // ignore dupes

        // Notify
        await prisma.notification.create({
          data: {
            type: 'BADGE_EARNED',
            recipientId: user.id,
            actorId: user.id,
            entityType: 'badge',
            entityId: badge.id,
          },
        }).catch(() => {});

        awarded++;
      }
    }
  }

  return awarded;
}

// Publish scheduled projects
export async function publishScheduledProjects(prisma) {
  const now = new Date();

  const projects = await prisma.project.findMany({
    where: {
      published: false,
      isDraft: false,
      scheduledAt: { lte: now },
    },
  });

  for (const project of projects) {
    await prisma.project.update({
      where: { id: project.id },
      data: { published: true, scheduledAt: null },
    });
  }

  return projects.length;
}

// Enhanced trend score that includes saves
export async function updateTrendScoresV2(prisma) {
  const projects = await prisma.project.findMany({
    where: { published: true },
    select: {
      id: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      saveCount: true,
      repostCount: true,
      createdAt: true,
    },
  });

  const now = Date.now();
  const updates = projects.map((p) => {
    const ageHours = Math.max(1, (now - p.createdAt.getTime()) / (1000 * 60 * 60));
    // Saves weighted most heavily (strongest engagement signal)
    const score = (
      p.saveCount * 5 +
      p.likeCount * 2 +
      p.commentCount * 3 +
      p.repostCount * 4 +
      p.viewCount * 0.1
    ) / Math.pow(ageHours, 0.8); // gravity decay

    return prisma.project.update({
      where: { id: p.id },
      data: { trendScore: Math.round(score * 100) / 100 },
    });
  });

  for (let i = 0; i < updates.length; i += 50) {
    await prisma.$transaction(updates.slice(i, i + 50));
  }
}
