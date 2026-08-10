"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUp, X } from "lucide-react";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";
import { getDefaultTrio } from "@/lib/infrastructure/model-catalog";
import { ModelPicker } from "./model-picker";
import { createThreadAction, createTurnAction } from "@/lib/actions/thread";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";

interface ArenaComposerProps {
  catalog: ModelCatalogItem[];
  threadId?: string;
  defaultSelection?: string[];
}

export function ArenaComposer({ catalog, threadId, defaultSelection }: ArenaComposerProps) {
  const { isSignedIn } = useAuth();
  const [selectedModels, setSelectedModels] = useState<ModelCatalogItem[]>([]);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize selected models
  useEffect(() => {
    if (catalog.length === 0) return;
    
    if (defaultSelection && defaultSelection.length > 0) {
      const initialModels = catalog.filter(m => defaultSelection.includes(m.id));
      setSelectedModels(initialModels.length > 0 ? initialModels : getDefaultTrio(catalog));
    } else if (!threadId) {
      setSelectedModels(getDefaultTrio(catalog));
    }
  }, [catalog, threadId, defaultSelection]);

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

  const handleSubmit = async () => {
    if (!isSignedIn) {
       // Fallback in case button isn't disabled (shouldn't happen)
       return;
    }
    if (!prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const selectedModelIds = selectedModels.map((m) => m.id);
      if (threadId) {
        const result = await createTurnAction(threadId, prompt, selectedModelIds);
        setPrompt(""); // Clear input on success
        if (result.didFork) {
          router.push(`/t/${result.threadId}`);
        }
      } else {
        const { threadId: newThreadId } = await createThreadAction(prompt, selectedModels);
        router.push(`/t/${newThreadId}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-shadow relative">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting || (isSignedIn === false)}
        className="w-full bg-transparent p-4 outline-none resize-none text-foreground placeholder:text-muted-foreground disabled:opacity-50 min-h-[56px] max-h-40 overflow-y-auto"
        rows={1}
        placeholder={isSignedIn === false ? "Sign in to ask a question." : "Ask anything. Enter to send, shift + enter for a new line."}
      />
      
      {isSignedIn === false && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
          <SignInButton mode="modal">
            <button className="bg-primary text-primary-foreground font-medium px-6 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
              Sign in to chat
            </button>
          </SignInButton>
        </div>
      )}

      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between relative z-0">
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
                  disabled={isSubmitting}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full p-0.5 transition-colors cursor-pointer disabled:opacity-50"
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

        <button 
          onClick={handleSubmit}
          disabled={!prompt.trim() || isSubmitting || !isSignedIn}
          className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all-150 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
