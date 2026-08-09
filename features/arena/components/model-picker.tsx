"use client";

import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";

interface ModelPickerProps {
  catalog: ModelCatalogItem[];
  selectedModels: ModelCatalogItem[];
  onToggleModel: (model: ModelCatalogItem) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelPicker({
  catalog,
  selectedModels,
  onToggleModel,
  open,
  onOpenChange,
}: ModelPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          disabled={selectedModels.length >= 3}
          className="border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs px-3 py-1.5 rounded-full transition-all-150"
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
                onClick={() => onToggleModel(model)}
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
  );
}
