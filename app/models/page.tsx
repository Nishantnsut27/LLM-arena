import { getFreeModels } from '@/lib/openrouter';

export default async function ModelsPage() {
  const models = await getFreeModels();

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Free Models</h1>
        <p className="text-foreground/80">
          A live catalog of all free-tier models currently available on OpenRouter, sorted by context window.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <div
            key={model.id}
            className="p-6 rounded-xl border border-foreground/10 bg-background shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-foreground mb-2">{model.name}</h2>
            <div className="text-sm text-foreground/70 mb-4 font-mono truncate" title={model.id}>
              {model.id}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-foreground/60 uppercase text-xs font-semibold tracking-wider">Context</span>
                <span className="font-medium">{(model.context_length / 1024).toFixed(0)}k</span>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground/60 uppercase text-xs font-semibold tracking-wider">Price</span>
                <span className="font-medium text-success">Free</span>
              </div>
            </div>
          </div>
        ))}

        {models.length === 0 && (
          <div className="col-span-full text-center py-12 text-foreground/60">
            No free models found or failed to load.
          </div>
        )}
      </div>
    </div>
  );
}
