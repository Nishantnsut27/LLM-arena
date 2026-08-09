import { getFreeModels } from "@/lib/infrastructure/model-catalog";

export const revalidate = 3600;

export default async function ModelsPage() {
  const models = await getFreeModels();

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-12">
        <h1 className="font-serif text-4xl mb-4">Model Catalog</h1>
        <p className="text-muted-foreground text-lg">
          The live list of free-tier models currently available in the arena, sorted by context window.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <div key={model.id} className="border border-border bg-card rounded-xl p-5 hover:border-primary/50 transition-all-150 flex flex-col">
            <h2 className="font-semibold text-lg mb-1 truncate" title={model.name}>{model.name}</h2>
            <div className="text-xs text-muted-foreground font-mono truncate mb-6" title={model.id}>{model.id}</div>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Context</div>
                <div className="font-mono text-sm">{model.formattedContext}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Provider</div>
                <div className="font-mono text-sm capitalize">{model.provider}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Price</div>
                <div className="font-mono text-sm">Free</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {models.length === 0 && (
        <div className="text-center py-24 text-muted-foreground border border-dashed border-border rounded-xl">
          Failed to load models or no free models available.
        </div>
      )}
    </div>
  );
}
