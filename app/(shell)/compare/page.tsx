import { getModelCatalog } from "@/lib/infrastructure/model-catalog";
import { getHeadToHeadStats } from "@/features/statistics/arena-statistics";
import { CompareScreen } from "@/features/compare/compare-screen";

export const revalidate = 300;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ modelA?: string; modelB?: string }>;
}) {
  const { modelA, modelB } = await searchParams;
  const catalog = await getModelCatalog();
  const modelAId = modelA && catalog.some((model) => model.id === modelA)
    ? modelA
    : catalog[0]?.id ?? "";
  // Search the whole catalog, not just the first entries, so a `?modelA=` link
  // from the leaderboard always resolves to a valid distinct second model.
  const modelBId = modelB && modelB !== modelAId && catalog.some((model) => model.id === modelB)
    ? modelB
    : catalog.find((model) => model.id !== modelAId)?.id ?? "";
  const catalogModelA = catalog.find((model) => model.id === modelAId);
  const catalogModelB = catalog.find((model) => model.id === modelBId);
  const stats = modelAId && modelBId && modelAId !== modelBId
    ? await getHeadToHeadStats(modelAId, modelBId, null, {
        modelA: catalogModelA?.name ?? modelAId,
        modelB: catalogModelB?.name ?? modelBId,
        modelAIsFree: catalogModelA?.pricing.isFree,
        modelBIsFree: catalogModelB?.pricing.isFree,
      })
    : null;

  return (
    <CompareScreen
      catalog={catalog}
      modelAId={modelAId}
      modelBId={modelBId}
      stats={stats}
      catalogUnavailable={catalog.length === 0}
    />
  );
}
