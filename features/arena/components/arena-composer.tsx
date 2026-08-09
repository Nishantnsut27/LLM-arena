"use client";

import { useState, useEffect } from "react";
import { ArrowUp, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";

interface ArenaComposerProps {
  catalog: ModelCatalogItem[];
}

export function ArenaComposer({ catalog }: ArenaComposerProps) {
  const [selectedModels, setSelectedModels] = useState<ModelCatalogItem[]>([]);
  const [open, setOpen] = useState(false);

  // Initialize with top trio
  useEffect(() => {
    if (catalog.length === 0) return;
    
    // Strategy: Highest context model per distinct provider
    const picked: ModelCatalogItem[] = [];
    const seenProviders = new Set<string>();

    for (const model of catalog) {
      if (!seenProviders.has(model.provider)) {
        picked.push(model);
        seenProviders.add(model.provider);
      }
      if (picked.length >= 3) break;
    }

    // Fallback if less than 3 distinct providers exist
    if (picked.length < 3) {
      for (const model of catalog) {
        if (!picked.some((m) => m.id === model.id)) {
          picked.push(model);
        }
        if (picked.length >= 3) break;
      }
    }

    setSelectedModels(picked);
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
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={selectedModels.length >= 3}
                className="border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-xs px-3 py-1.5 rounded-full transition-all-150"
                title={selectedModels.length >= 3 ? "Maximum 3 models selected" : "Add a model"}
              >
                Add model
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[320px] p-0 rounded-xl overflow-hidden shadow-lg border-border"
            >
              <div className="max-h-[300px] overflow-y-auto p-1">
                {catalog.map((model) => {
                  const isSelected = selectedModels.some((m) => m.id === model.id);
                  const isDisabled = !isSelected && selectedModels.length >= 3;

                  return (
                    <button
                      key={model.id}
                      disabled={isDisabled}
                      onClick={() => toggleModel(model)}
                      className={`w-full flex flex-col text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold truncate pr-2">{model.name}</span>
                        {isSelected && <Check size={16} className="text-primary flex-shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{model.provider}</span>
                        <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
                          {model.formattedContext}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all-150 ml-2">
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
