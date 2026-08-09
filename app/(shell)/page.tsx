import { ArrowUp, X } from "lucide-react";

export default function ArenaPlaceholder() {
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
      <div className="p-4 pb-8 max-w-4xl mx-auto w-full">
        <div className="border border-border bg-card/30 rounded-2xl overflow-hidden shadow-sm">
          <textarea 
            className="w-full bg-transparent p-4 pb-12 outline-none resize-none text-foreground placeholder:text-muted-foreground"
            rows={3}
            placeholder="Ask anything. Enter to send, shift + enter for a new line."
            readOnly
          />
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ModelChip label="Phi 4 Reasoning" />
              <ModelChip label="Qwen 3 Coder" />
              <ModelChip label="Nemotron 3 Ultra" />
              <button className="border border-border text-muted-foreground hover:text-foreground text-xs px-3 py-1.5 rounded-full transition-all-150">
                Add model
              </button>
            </div>
            
            <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all-150 ml-2">
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-3">
          Up to three models at a time. Every one of them is free.
        </p>
      </div>
      
      {/* Feature 5 and 6 will kill this placeholder */}
    </div>
  );
}

function ModelChip({ label }: { label: string }) {
  return (
    <div className="border border-border bg-background/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-background transition-all-150 cursor-default">
      {label}
      <button className="hover:text-foreground">
        <X size={12} />
      </button>
    </div>
  );
}
