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

  // If it's a personal view but the user has no DB record, they have no stats.
  // We must not pass null to getLeaderboardStandings, as null means "global".
  const rows = isPersonal 
    ? (dbUserId ? await getLeaderboardStandings(dbUserId) : [])
    : await getLeaderboardStandings(null);

  return (
    <LeaderboardScreen
      rows={rows}
      view={isPersonal ? "personal" : "global"}
      isSignedIn={!!clerkId}
    />
  );
}
