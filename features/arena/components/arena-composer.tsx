"use client";

import { useState, useEffect } from "react";
import { ArrowUp, X } from "lucide-react";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";
import { getDefaultTrio } from "@/lib/infrastructure/model-catalog";
import { ModelPicker } from "./model-picker";

interface ArenaComposerProps {
  catalog: ModelCatalogItem[];
}

export function ArenaComposer({ catalog }: ArenaComposerProps) {
  const [selectedModels, setSelectedModels] = useState<ModelCatalogItem[]>([]);
  const [open, setOpen] = useState(false);

  // Initialize with top trio
  useEffect(() => {
    if (catalog.length === 0) return;
    setSelectedModels(getDefaultTrio(catalog));
  }, [catalog]);

  const toggleModel = (model: ModelCatalogItem) => {
    setSelectedModels((prev) => {
      const isSelected = prev.some((m) => m.id === model.id);
      if (isSelected) {
        if (prev.length <= 1) return prev; // Floor of 1
        return prev.filter((m) => m.id !== model.id);
      }
      if (prev.length >= 3) return prev; // Cap of 3
      return [...prev, model];
    });
  };

  const removeModel = (id: string) => {
    if (selectedModels.length <= 1) return;
    setSelectedModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="border border-border bg-card/30 rounded-2xl overflow-hidden shadow-sm">
      <textarea
        className="w-full bg-transparent p-4 pb-12 outline-none resize-none text-foreground placeholder:text-muted-foreground"
        rows={3}
        placeholder="Ask anything. Enter to send, shift + enter for a new line."
        readOnly
      />
      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {selectedModels.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-full text-xs font-medium"
            >
              <span className="truncate max-w-[120px]">{model.name}</span>
              {selectedModels.length > 1 && (
                <button
                  onClick={() => removeModel(model.id)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full p-0.5 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <ModelPicker
            catalog={catalog}
            selectedModels={selectedModels}
            onToggleModel={toggleModel}
            open={open}
            onOpenChange={setOpen}
          />
        </div>

        <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all-150 ml-2">
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
