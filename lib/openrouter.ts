export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export async function getFreeModels(): Promise<OpenRouterModel[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch models from OpenRouter');
    }

    const json = await res.json();
    const models: OpenRouterModel[] = json.data;

    const freeModels = models
      .filter((model) => model.pricing.prompt === '0' && model.pricing.completion === '0')
      .sort((a, b) => b.context_length - a.context_length);

    return freeModels;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return [];
  }
}
