import "server-only";
import { prisma } from "@/lib/db";

export type LeaderboardRow = {
  modelId: string;
  modelName: string;
  winRate: number;
  wins: number;
  total: number;
  avgTimeToFirstToken: number | null;
  avgTokensPerSecond: number | null;
};

export async function getLeaderboardStandings(scopeUserId: string | null): Promise<LeaderboardRow[]> {
  const whereClause = scopeUserId
    ? {
        status: "complete",
        turn: { thread: { userId: scopeUserId } },
      }
    : {
        status: "complete",
      };

  const responses = await prisma.modelResponse.findMany({
    where: whereClause,
    include: {
      turn: {
        include: { vote: true },
      },
    },
  });

  const statsMap = new Map<
    string,
    {
      modelName: string;
      wins: number;
      total: number;
      sumTtft: number;
      countTtft: number;
      sumTps: number;
      countTps: number;
    }
  >();

  for (const response of responses) {
    if (!statsMap.has(response.modelId)) {
      statsMap.set(response.modelId, {
        modelName: response.modelNameSnapshot,
        wins: 0,
        total: 0,
        sumTtft: 0,
        countTtft: 0,
        sumTps: 0,
        countTps: 0,
      });
    }

    const stats = statsMap.get(response.modelId)!;

    // Only count as part of the win/loss denominator if the user actually cast a vote for this turn
    if (response.turn.vote) {
      stats.total += 1;
      if (response.turn.vote.winnerModelId === response.modelId) {
        stats.wins += 1;
      }
    }

    if (response.timeToFirstToken !== null) {
      stats.sumTtft += response.timeToFirstToken;
      stats.countTtft += 1;
    }

    if (response.tokensPerSecond !== null) {
      stats.sumTps += response.tokensPerSecond;
      stats.countTps += 1;
    }
  }

  const rows: LeaderboardRow[] = Array.from(statsMap.entries()).map(([modelId, stats]) => ({
    modelId,
    modelName: stats.modelName,
    winRate: stats.total > 0 ? stats.wins / stats.total : 0,
    wins: stats.wins,
    total: stats.total,
    avgTimeToFirstToken: stats.countTtft > 0 ? Math.round(stats.sumTtft / stats.countTtft) : null,
    avgTokensPerSecond: stats.countTps > 0 ? Number((stats.sumTps / stats.countTps).toFixed(1)) : null,
  }));

  rows.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.total !== a.total) return b.total - a.total;
    return a.modelName.localeCompare(b.modelName);
  });

  return rows;
}
