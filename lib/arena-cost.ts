export type ModelPricing = {
  prompt: number | null;
  completion: number | null;
  isFree: boolean;
};

export type EstimatedCostInput = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  pricing?: ModelPricing | null;
};

/** OpenRouter pricing is expressed in dollars per token. */
export function calculateEstimatedCost({
  inputTokens,
  outputTokens,
  pricing,
}: EstimatedCostInput): number | null {
  if (
    inputTokens == null ||
    outputTokens == null ||
    !Number.isFinite(inputTokens) ||
    !Number.isFinite(outputTokens) ||
    inputTokens < 0 ||
    outputTokens < 0 ||
    pricing?.prompt == null ||
    pricing.completion == null
  ) {
    return null;
  }

  return inputTokens * pricing.prompt + outputTokens * pricing.completion;
}

export function formatEstimatedCost(
  costUsd: number | null | undefined,
  isFree = false,
): string {
  if (costUsd == null || !Number.isFinite(costUsd)) return "—";
  if (isFree && costUsd === 0) return "Free";
  if (costUsd === 0) return "$0.00";

  const maximumFractionDigits = costUsd < 0.01 ? (costUsd < 0.000001 ? 12 : 6) : costUsd < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  }).format(costUsd);
}
