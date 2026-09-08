import { z } from "zod";

const ModelRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  context_length: z.number().optional().default(0),
  pricing: z.object({
    prompt: z.union([z.string(), z.number()]).nullable().optional(),
    completion: z.union([z.string(), z.number()]).nullable().optional(),
  }).optional().default({}),
});

export type ModelRow = z.infer<typeof ModelRowSchema>;

export type ModelCatalogItem = {
  id: string;
  name: string;
  contextLength: number;
  formattedContext: string;
  provider: string;
  pricing: {
    prompt: number | null;
    completion: number | null;
    isFree: boolean;
  };
};

function parsePrice(value: string | number | null | undefined): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatContextLength(length: number): string {
  if (length >= 1000000) {
    return `${Math.floor(length / 1000000)}M`;
  }
  if (length >= 1000) {
    return `${Math.floor(length / 1000)}K`;
  }
  return length.toString();
}

export async function getModelCatalog(): Promise<ModelCatalogItem[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error("Failed to fetch models from OpenRouter:", response.statusText);
      return [];
    }

    const json = await response.json();
    if (!json || !Array.isArray(json.data)) {
      return [];
    }

    const validModels: ModelCatalogItem[] = [];

    // Parse per row to drop bad rows instead of throwing
    for (const row of json.data) {
      const parsed = ModelRowSchema.safeParse(row);
      if (parsed.success) {
        const model = parsed.data;
        const prompt = parsePrice(model.pricing.prompt);
        const completion = parsePrice(model.pricing.completion);
        const provider = model.id.split("/")[0] || "unknown";
        validModels.push({
          id: model.id,
          name: model.name,
          contextLength: model.context_length,
          formattedContext: formatContextLength(model.context_length),
          provider,
          pricing: {
            prompt,
            completion,
            isFree: prompt === 0 && completion === 0,
          },
        });
      } else {
        // We drop the row silently, preserving the rest of the valid models
      }
    }

    // Sort by context window descending
    validModels.sort((a, b) => b.contextLength - a.contextLength);

    return validModels;
  } catch (err) {
    console.error("Error fetching models:", err);
    return [];
  }
}

/** The Arena currently exposes only free OpenRouter models for generation. */
export async function getFreeModels(): Promise<ModelCatalogItem[]> {
  const models = await getModelCatalog();
  return models.filter((model) => model.pricing.isFree);
}

export function getDefaultTrio(models: ModelCatalogItem[]): ModelCatalogItem[] {
  const trio: ModelCatalogItem[] = [];
  const seenProviders = new Set<string>();

  for (const model of models) {
    if (trio.length >= 3) break;
    if (!seenProviders.has(model.provider)) {
      trio.push(model);
      seenProviders.add(model.provider);
    }
  }

  // If we couldn't find 3 distinct providers, just fill the rest from what's left
  if (trio.length < 3) {
    for (const model of models) {
      if (trio.length >= 3) break;
      if (!trio.find((t) => t.id === model.id)) {
        trio.push(model);
      }
    }
  }

  return trio;
}
