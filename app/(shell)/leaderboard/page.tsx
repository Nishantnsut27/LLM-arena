import { auth } from "@clerk/nextjs/server";
import { getLeaderboardStandings } from "@/features/leaderboard/leaderboard-standings";
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen";
import { prisma } from "@/lib/db";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const isPersonal = view === "me";
  const { userId: clerkId } = await auth();

  let dbUserId: string | null = null;
  if (isPersonal && clerkId) {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (user) dbUserId = user.id;
  }

  const scopeUserId = isPersonal && dbUserId ? dbUserId : null;
  const rows = isPersonal && !clerkId ? [] : await getLeaderboardStandings(scopeUserId);

  return (
    <LeaderboardScreen
      rows={rows}
      view={isPersonal ? "personal" : "global"}
      isSignedIn={!!clerkId}
    />
  );
}
