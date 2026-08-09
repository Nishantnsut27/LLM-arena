import { getFreeModels } from "@/lib/infrastructure/model-catalog";
import { ArenaComposer } from "@/features/arena/components/arena-composer";

export default async function ArenaPage() {
  const catalog = await getFreeModels();

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full text-center mt-[-10vh]">
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Ask three models at once</h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
          One prompt goes to every model you pick. They answer side by side, each with its
          own real speed and token count, and you decide which one was actually worth it.
        </p>
      </div>

      {/* Input box pinned to bottom */}
      <div className="bg-background/85 sticky bottom-0 px-4 pt-2 pb-4 backdrop-blur-sm sm:px-6 w-full">
        <div className="mx-auto max-w-4xl p-3">
          <ArenaComposer catalog={catalog} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Up to three models at a time. Every one of them is free.
          </p>
        </div>
      </div>
    </div>
  );
}
