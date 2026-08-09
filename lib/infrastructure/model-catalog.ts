import { z } from "zod";

const ModelRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  context_length: z.number(),
  pricing: z.object({
    prompt: z.string(),
    completion: z.string(),
  }),
});

export type ModelRow = z.infer<typeof ModelRowSchema>;

export type ModelCatalogItem = {
  id: string;
  name: string;
  contextLength: number;
  formattedContext: string;
  provider: string;
};

function formatContextLength(length: number): string {
  if (length >= 1000000) {
    return `${Math.floor(length / 1000000)}M`;
  }
  if (length >= 1000) {
    return `${Math.floor(length / 1000)}K`;
  }
  return length.toString();
}

export async function getFreeModels(): Promise<ModelCatalogItem[]> {
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
        // Check if truly free
        if (model.pricing.prompt === "0" && model.pricing.completion === "0") {
          const provider = model.id.split("/")[0] || "unknown";
          validModels.push({
            id: model.id,
            name: model.name,
            contextLength: model.context_length,
            formattedContext: formatContextLength(model.context_length),
            provider,
          });
        }
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
