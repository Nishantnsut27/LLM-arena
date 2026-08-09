import "server-only";

import { prisma } from "@/lib/db";
import { GROUP_ORDER, groupLabel, type ThreadGroup, type ThreadSummary } from "./thread-groups";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const listThreadHistory = async (
  userId: string,
): Promise<readonly ThreadGroup[]> => {
  const threads = await prisma.thread.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      turns: { select: { responses: { select: { modelId: true } } } },
    },
  });

  const today = startOfDay(new Date());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const groups = new Map<string, ThreadSummary[]>();

  for (const thread of threads) {
    const label = groupLabel(thread.updatedAt, today, weekAgo);
    const modelCount = new Set(
      thread.turns.flatMap((turn) => turn.responses.map((response) => response.modelId)),
    ).size;

    const group = groups.get(label) ?? [];
    group.push({ id: thread.id, title: thread.title || "New Thread", modelCount });
    groups.set(label, group);
  }

  return GROUP_ORDER.filter((label) => groups.has(label)).map((label) => ({
    label,
    threads: groups.get(label)!,
  }));
};
