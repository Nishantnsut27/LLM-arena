export type ThreadSummary = {
  readonly id: string;
  readonly title: string;
  readonly modelCount: number;
};

export type ThreadGroup = {
  readonly label: string;
  readonly threads: readonly ThreadSummary[];
};

export const TODAY = "Today";
const THIS_WEEK = "Previous 7 Days";
const EARLIER = "Earlier";

export const GROUP_ORDER = [TODAY, THIS_WEEK, EARLIER] as const;

export const groupLabel = (updatedAt: Date, today: Date, weekAgo: Date): string => {
  if (updatedAt >= today) return TODAY;
  if (updatedAt >= weekAgo) return THIS_WEEK;
  return EARLIER;
};
