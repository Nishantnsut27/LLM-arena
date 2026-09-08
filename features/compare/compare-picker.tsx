"use client";

import { ArrowLeftRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";

export function ComparePicker({
  catalog,
  modelAId,
  modelBId,
}: {
  catalog: ModelCatalogItem[];
  modelAId: string;
  modelBId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(normalized));
  }, [catalog, query]);

  const navigate = (nextA: string, nextB: string) => {
    if (nextA === nextB) return;
    router.push(`/compare?modelA=${encodeURIComponent(nextA)}&modelB=${encodeURIComponent(nextB)}`);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Choose two models</h2>
          <p className="text-sm text-muted-foreground">Your comparison, from the live model catalog.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => navigate(modelBId, modelAId)}
          aria-label="Swap models"
          title="Swap models"
        >
          <ArrowLeftRight size={16} />
        </button>
      </div>
      <label className="mb-3 flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search models"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[{ label: "Model A", id: modelAId }, { label: "Model B", id: modelBId }].map((slot) => (
          <label key={slot.label} className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {slot.label}
            <select
              value={slot.id}
              onChange={(event) => navigate(slot.label === "Model A" ? event.target.value : modelAId, slot.label === "Model B" ? event.target.value : modelBId)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a model</option>
              {filteredCatalog.filter((model) => model.id === slot.id || model.id !== (slot.label === "Model A" ? modelBId : modelAId)).map((model) => (
                <option key={model.id} value={model.id} disabled={model.id === (slot.label === "Model A" ? modelBId : modelAId)}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
