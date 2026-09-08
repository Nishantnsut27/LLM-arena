import "server-only";

import { prisma } from "@/lib/db";

export const ARENA_INITIAL_RATING = 1000;
export const ARENA_K_FACTOR = 32;
export const ARENA_RANKED_BATTLE_MINIMUM = 20;

export type Confidence = "Low" | "Medium" | "High";

export type ArenaModelStats = {
  modelId: string;
  modelName: string;
  rating: number;
  rank: number | null;
  provisional: boolean;
  confidence: Confidence;
  winRate: number | null;
  wins: number;
  losses: number;
  battles: number;
  votes: number;
  completedResponses: number;
  avgTimeToFirstToken: number | null;
  avgTokensPerSecond: number | null;
  avgInputTokens: number | null;
  avgOutputTokens: number | null;
  avgTotalTokens: number | null;
  avgCostUsd: number | null;
  isFree: boolean;
};

export type HeadToHeadStats = {
  modelA: ArenaModelStats;
  modelB: ArenaModelStats;
  battles: number;
  modelAWins: number;
  modelBWins: number;
  modelAWinRate: number | null;
  modelBWinRate: number | null;
  recentModelAWinRate: number | null;
  recentBattleCount: number;
};

type MutableStats = Omit<ArenaModelStats, "rating" | "rank" | "provisional" | "confidence" | "winRate"> & {
  rating: number;
};

function confidenceFor(battles: number): Confidence {
  if (battles < ARENA_RANKED_BATTLE_MINIMUM) return "Low";
  if (battles < 100) return "Medium";
  return "High";
}

function emptyModelStats(modelId: string, modelName: string, isFree = false): ArenaModelStats {
  return {
    modelId,
    modelName,
    rating: ARENA_INITIAL_RATING,
    rank: null,
    provisional: true,
    confidence: "Low",
    winRate: null,
    wins: 0,
    losses: 0,
    battles: 0,
    votes: 0,
    completedResponses: 0,
    avgTimeToFirstToken: null,
    avgTokensPerSecond: null,
    avgInputTokens: null,
    avgOutputTokens: null,
    avgTotalTokens: null,
    avgCostUsd: null,
    isFree,
  };
}

export function calculateEloChange(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  kFactor = ARENA_K_FACTOR,
): number {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  return kFactor * (scoreA - expectedA);
}

function roundNullable(value: number | null | undefined, digits = 0): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

async function buildArenaStats(scopeUserId: string | null) {
  const threadScope = scopeUserId ? { turn: { thread: { userId: scopeUserId } } } : {};

  const [performanceRows, votes] = await Promise.all([
    prisma.modelResponse.groupBy({
      by: ["modelId", "modelNameSnapshot"],
      where: { status: "complete", ...threadScope },
      _count: { _all: true },
      _avg: {
        timeToFirstToken: true,
        tokensPerSecond: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costUsd: true,
      },
    }),
    prisma.vote.findMany({
      where: scopeUserId ? { turn: { thread: { userId: scopeUserId } } } : undefined,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        createdAt: true,
        winnerModelId: true,
        turn: {
          select: {
            responses: {
              where: { status: "complete" },
              orderBy: { modelId: "asc" },
              select: { modelId: true, modelNameSnapshot: true },
            },
          },
        },
      },
    }),
  ]);

  const stats = new Map<string, MutableStats>();
  const ensureStats = (modelId: string, modelName: string): MutableStats => {
    const current = stats.get(modelId);
    if (current) return current;
    const created: MutableStats = {
      modelId,
      modelName,
      rating: ARENA_INITIAL_RATING,
      wins: 0,
      losses: 0,
      battles: 0,
      votes: 0,
      completedResponses: 0,
      avgTimeToFirstToken: null,
      avgTokensPerSecond: null,
      avgInputTokens: null,
      avgOutputTokens: null,
      avgTotalTokens: null,
      avgCostUsd: null,
      isFree: false,
    };
    stats.set(modelId, created);
    return created;
  };

  const aggregateWeights = new Map<string, number>();
  for (const row of performanceRows) {
    const target = ensureStats(row.modelId, row.modelNameSnapshot);
    const previousWeight = aggregateWeights.get(row.modelId) ?? 0;
    const rowWeight = row._count._all;
    const totalWeight = previousWeight + rowWeight;
    const mergeAverage = (current: number | null, incoming: number | null) => {
      if (incoming == null) return current;
      if (current == null || previousWeight === 0) return incoming;
      return (current * previousWeight + incoming * rowWeight) / totalWeight;
    };

    target.modelName = row.modelNameSnapshot;
    target.completedResponses += rowWeight;
    target.avgTimeToFirstToken = mergeAverage(target.avgTimeToFirstToken, row._avg.timeToFirstToken);
    target.avgTokensPerSecond = mergeAverage(target.avgTokensPerSecond, row._avg.tokensPerSecond);
    target.avgInputTokens = mergeAverage(target.avgInputTokens, row._avg.inputTokens);
    target.avgOutputTokens = mergeAverage(target.avgOutputTokens, row._avg.outputTokens);
    target.avgTotalTokens = mergeAverage(target.avgTotalTokens, row._avg.totalTokens);
    target.avgCostUsd = mergeAverage(target.avgCostUsd, row._avg.costUsd);
    aggregateWeights.set(row.modelId, totalWeight);
  }

  const validVotes: Array<{
    id: string;
    createdAt: Date;
    winnerModelId: string;
    participantIds: string[];
  }> = [];

  for (const vote of votes) {
    const participants = Array.from(
      new Map(vote.turn.responses.map((response) => [response.modelId, response])).values(),
    );
    const winner = participants.find((response) => response.modelId === vote.winnerModelId);
    if (!winner || participants.length < 2) continue;

    const winnerStats = ensureStats(winner.modelId, winner.modelNameSnapshot);
    const losers = participants.filter((response) => response.modelId !== winner.modelId);
    const pairKFactor = ARENA_K_FACTOR / losers.length;

    winnerStats.wins += 1;
    winnerStats.battles += 1;
    winnerStats.votes += 1;

    for (const loser of losers) {
      const loserStats = ensureStats(loser.modelId, loser.modelNameSnapshot);
      loserStats.losses += 1;
      loserStats.battles += 1;
      loserStats.votes += 1;

      const winnerChange = calculateEloChange(
        winnerStats.rating,
        loserStats.rating,
        1,
        pairKFactor,
      );
      const loserChange = calculateEloChange(
        loserStats.rating,
        winnerStats.rating,
        0,
        pairKFactor,
      );
      winnerStats.rating += winnerChange;
      loserStats.rating += loserChange;
    }

    validVotes.push({
      id: vote.id,
      createdAt: vote.createdAt,
      winnerModelId: vote.winnerModelId,
      participantIds: participants.map((response) => response.modelId),
    });
  }

  const rows: ArenaModelStats[] = Array.from(stats.values()).map((row) => ({
    ...row,
    rating: Math.round(row.rating),
    rank: null,
    provisional: row.battles < ARENA_RANKED_BATTLE_MINIMUM,
    confidence: confidenceFor(row.battles),
    winRate: row.battles > 0 ? row.wins / row.battles : null,
    avgTimeToFirstToken: roundNullable(row.avgTimeToFirstToken),
    avgTokensPerSecond: roundNullable(row.avgTokensPerSecond, 1),
    avgInputTokens: roundNullable(row.avgInputTokens),
    avgOutputTokens: roundNullable(row.avgOutputTokens),
    avgTotalTokens: roundNullable(row.avgTotalTokens),
    avgCostUsd: roundNullable(row.avgCostUsd, 10),
    isFree: row.isFree,
  }));

  rows.sort((a, b) => {
    if (a.provisional !== b.provisional) return a.provisional ? 1 : -1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.battles !== a.battles) return b.battles - a.battles;
    return a.modelName.localeCompare(b.modelName);
  });

  let rank = 0;
  for (const row of rows) {
    if (!row.provisional) row.rank = ++rank;
  }

  return { rows, validVotes };
}

export async function getLeaderboardStandings(scopeUserId: string | null): Promise<ArenaModelStats[]> {
  return (await buildArenaStats(scopeUserId)).rows;
}

export async function getHeadToHeadStats(
  modelAId: string,
  modelBId: string,
  scopeUserId: string | null = null,
  modelNames?: { modelA: string; modelB: string; modelAIsFree?: boolean; modelBIsFree?: boolean },
): Promise<HeadToHeadStats | null> {
  if (!modelAId || !modelBId || modelAId === modelBId) return null;

  const { rows, validVotes } = await buildArenaStats(scopeUserId);
  const modelA = rows.find((row) => row.modelId === modelAId) ??
    (modelNames ? emptyModelStats(modelAId, modelNames.modelA, modelNames.modelAIsFree) : null);
  const modelB = rows.find((row) => row.modelId === modelBId) ??
    (modelNames ? emptyModelStats(modelBId, modelNames.modelB, modelNames.modelBIsFree) : null);
  if (!modelA || !modelB) return null;

  // The catalog is the source of truth for whether a model is free; a DB row
  // resolved above defaults to `false` and must be corrected here so that
  // "Free" vs "$0.00" rendering stays consistent across the app.
  if (modelNames?.modelAIsFree != null) modelA.isFree = modelNames.modelAIsFree;
  if (modelNames?.modelBIsFree != null) modelB.isFree = modelNames.modelBIsFree;

  const directOutcomes = validVotes.filter(
    (vote) =>
      vote.participantIds.includes(modelAId) &&
      vote.participantIds.includes(modelBId) &&
      (vote.winnerModelId === modelAId || vote.winnerModelId === modelBId),
  );
  const modelAWins = directOutcomes.filter((vote) => vote.winnerModelId === modelAId).length;
  const modelBWins = directOutcomes.length - modelAWins;
  const recent = directOutcomes.slice(-20);
  const recentModelAWins = recent.filter((vote) => vote.winnerModelId === modelAId).length;

  return {
    modelA,
    modelB,
    battles: directOutcomes.length,
    modelAWins,
    modelBWins,
    modelAWinRate: directOutcomes.length > 0 ? modelAWins / directOutcomes.length : null,
    modelBWinRate: directOutcomes.length > 0 ? modelBWins / directOutcomes.length : null,
    recentModelAWinRate: recent.length > 0 ? recentModelAWins / recent.length : null,
    recentBattleCount: recent.length,
  };
}
