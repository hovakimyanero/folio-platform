// Trending score formula:
// score = (likes * 2 + comments * 3 + views) / age_in_hours
// Updated every 10 minutes via cron

export async function updateTrendScores(prisma) {
  const projects = await prisma.project.findMany({
    where: { published: true },
    select: {
      id: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      createdAt: true,
    },
  });

  const now = Date.now();
  const updates = projects.map((p) => {
    const ageHours = Math.max(1, (now - p.createdAt.getTime()) / (1000 * 60 * 60));
    const score = (p.likeCount * 2 + p.commentCount * 3 + p.viewCount) / ageHours;

    return prisma.project.update({
      where: { id: p.id },
      data: { trendScore: Math.round(score * 100) / 100 },
    });
  });

  // Batch in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    await prisma.$transaction(updates.slice(i, i + 50));
  }
}
