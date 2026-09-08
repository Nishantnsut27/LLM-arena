import { formatEstimatedCost } from "@/lib/arena-cost";
import type { HeadToHeadStats } from "@/features/statistics/arena-statistics";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";
import { ComparePicker } from "./compare-picker";

function percentage(value: number | null) {
  return value == null ? "-" : `${Math.round(value * 100)}%`;
}

function metric(value: number | null, suffix = "") {
  return value == null ? "-" : `${value.toLocaleString()}${suffix}`;
}

export function CompareScreen({
  catalog,
  modelAId,
  modelBId,
  stats,
  catalogUnavailable = false,
}: {
  catalog: ModelCatalogItem[];
  modelAId: string;
  modelBId: string;
  stats: HeadToHeadStats | null;
  catalogUnavailable?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Head to head</p>
        <h1 className="font-serif text-4xl font-bold">Compare models</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">See what people picked when these models answered the same question side by side.</p>
      </div>
      <ComparePicker catalog={catalog} modelAId={modelAId} modelBId={modelBId} />
      {catalogUnavailable ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <h2 className="font-semibold">The model catalog is unavailable right now.</h2>
          <p className="mt-2 text-muted-foreground">
            We could not reach OpenRouter to load the model list. This is not a lack of battle data — please try again shortly.
          </p>
        </div>
      ) : !stats ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <h2 className="font-semibold">Pick two different models to compare.</h2>
          <p className="mt-2 text-muted-foreground">Choose a model in each slot above to see their head-to-head record.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[stats.modelA, stats.modelB].map((model) => (
              <div key={model.modelId} className="rounded-2xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground">{model.modelId === modelAId ? "Model A" : "Model B"}</div>
                <h2 className="mt-1 truncate font-serif text-2xl font-bold">{model.modelName}</h2>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div><div className="text-xs text-muted-foreground">Rating</div><div className="text-2xl font-bold text-primary">{model.rating}</div></div>
                  <div><div className="text-xs text-muted-foreground">Win rate</div><div className="text-2xl font-bold">{percentage(model.winRate)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Battles</div><div className="text-2xl font-bold">{model.battles.toLocaleString()}</div></div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">{model.provisional ? "Provisional rating" : `Confidence: ${model.confidence}`}</div>
              </div>
            ))}
          </div>
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Head to head</p>
            {stats.battles === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
                <h2 className="font-semibold">No head-to-head battles yet.</h2>
                <p className="mt-2 text-sm text-muted-foreground">Run a battle between these models to start building this comparison.</p>
              </div>
            ) : <div className="mt-4 grid grid-cols-3 items-end gap-3 text-center">
              <div><div className="text-lg font-semibold">{stats.modelA.modelName}</div><div className="mt-1 text-3xl font-bold text-primary">{percentage(stats.modelAWinRate)}</div><div className="text-xs text-muted-foreground">{stats.modelAWins} wins</div></div>
              <div className="text-sm text-muted-foreground"><div className="font-semibold text-foreground">{stats.battles.toLocaleString()}</div>battles</div>
              <div><div className="text-lg font-semibold">{stats.modelB.modelName}</div><div className="mt-1 text-3xl font-bold text-primary">{percentage(stats.modelBWinRate)}</div><div className="text-xs text-muted-foreground">{stats.modelBWins} wins</div></div>
            </div>}
            {stats.recentModelAWinRate != null && <p className="mt-5 text-center text-sm text-muted-foreground">Recent trend, last {stats.recentBattleCount}: {stats.modelA.modelName} {percentage(stats.recentModelAWinRate)}</p>}
          </section>
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Performance</h2><p className="text-sm text-muted-foreground">Averages from completed responses in the Arena.</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm"><thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">Metric</th><th className="px-5 py-3 text-right">{stats.modelA.modelName}</th><th className="px-5 py-3 text-right">{stats.modelB.modelName}</th></tr></thead><tbody className="divide-y divide-border">
                <tr><td className="px-5 py-3 text-muted-foreground">TTFT</td><td className="px-5 py-3 text-right">{metric(stats.modelA.avgTimeToFirstToken, " ms")}</td><td className="px-5 py-3 text-right">{metric(stats.modelB.avgTimeToFirstToken, " ms")}</td></tr>
                <tr><td className="px-5 py-3 text-muted-foreground">Speed</td><td className="px-5 py-3 text-right">{metric(stats.modelA.avgTokensPerSecond, " tok/s")}</td><td className="px-5 py-3 text-right">{metric(stats.modelB.avgTokensPerSecond, " tok/s")}</td></tr>
                <tr><td className="px-5 py-3 text-muted-foreground">Tokens</td><td className="px-5 py-3 text-right">{metric(stats.modelA.avgTotalTokens)}</td><td className="px-5 py-3 text-right">{metric(stats.modelB.avgTotalTokens)}</td></tr>
                <tr><td className="px-5 py-3 text-muted-foreground">Estimated cost</td><td className="px-5 py-3 text-right">{formatEstimatedCost(stats.modelA.avgCostUsd, stats.modelA.isFree)}</td><td className="px-5 py-3 text-right">{formatEstimatedCost(stats.modelB.avgCostUsd, stats.modelB.isFree)}</td></tr>
              </tbody></table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
