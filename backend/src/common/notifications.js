// Helper to check if a user wants to receive a specific notification type
export async function shouldNotify(prisma, recipientId, type) {
  const user = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { notificationPrefs: true },
  });

  if (!user || !user.notificationPrefs) return true; // default: all on

  const prefs = user.notificationPrefs;
  const map = {
    LIKE: 'likes',
    COMMENT: 'comments',
    FOLLOW: 'follows',
    MENTION: 'comments',
    SAVE: 'saves',
    REPOST: 'likes',
    WEEKLY_PICK: 'likes',
    BADGE_EARNED: 'likes',
    LEVEL_UP: 'likes',
    CHALLENGE_WINNER: 'likes',
    SYSTEM: 'likes',
  };

  const key = map[type] || 'likes';
  return prefs[key] !== false;
}
