"use client";

import { Check } from "lucide-react";
import { type UIMessage } from "ai";

export interface ModelResponseCardProps {
  modelId: string;
  modelName: string;
  status: "streaming" | "complete" | "failed";
  text?: string;
  timeToFirstToken?: number | null;
  tokensPerSecond?: number | null;
  totalTokens?: number | null;
  isWinner?: boolean;
  canVote?: boolean;
  onVote?: () => void;
  // If streaming mode
  messages?: UIMessage[];
  isLoading?: boolean;
  error?: Error;
}

export function ModelResponseCard({
  modelName,
  status,
  text,
  timeToFirstToken,
  tokensPerSecond,
  totalTokens,
  isWinner,
  canVote,
  onVote,
  messages,
  isLoading,
  error
}: ModelResponseCardProps) {
  // In AI SDK v7, UIMessage has NO `content` field — text lives in `parts`
  // as { type: 'text', text: string } entries. `content` is undefined in v7.
  const extractText = (msg: UIMessage | undefined): string | null => {
    if (!msg) return null;
    // Primary: AI SDK v7 parts array
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      const text = msg.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text as string)
        .join("");
      if (text) return text;
    }
    // Fallback: older AI SDK versions that put text in `content` as a string
    const content = (msg as any).content;
    if (typeof content === "string" && content) return content;
    if (Array.isArray(content)) {
      const text = content.filter((p: any) => p.type === "text").map((p: any) => p.text).join("");
      if (text) return text;
    }
    return null;
  };

  // Always prefer messages (live or completed stream), fall back to text prop (historical responses)
  const lastAssistantMsg = messages?.filter((m) => m.role === "assistant").at(-1);
  const displayContent = extractText(lastAssistantMsg) || text || null;

  const renderContent = () => {
    if (status === "failed" || error) {
      return (
        <span className="text-destructive font-medium flex items-center gap-2">
          <span>Not available right now. Please change the model.</span>
        </span>
      );
    }
    if (status === "streaming" && !displayContent) {
      return <span className="text-muted-foreground animate-pulse">Thinking…</span>;
    }
    if (displayContent) {
      return displayContent;
    }
    if (isLoading) {
      return <span className="text-muted-foreground animate-pulse">Thinking…</span>;
    }
    return <span className="text-muted-foreground italic">No response.</span>;
  };

  const avatarLetter = modelName.charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden bg-background ${isWinner ? 'border-primary shadow-md ring-1 ring-primary' : 'border-border'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 text-sm bg-background">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-secondary-foreground font-medium">
            {avatarLetter}
          </div>
          <span className="font-medium truncate text-foreground">{modelName}</span>
        </div>
        {isWinner && (
          <span className="flex items-center gap-1 text-primary text-xs font-medium shrink-0 ml-2">
            <Check size={14} />
            Winner
          </span>
        )}
        {!isWinner && canVote && status !== "failed" && !error && (
          <button 
            onClick={onVote}
            className="text-xs px-3 py-1 rounded-full border shadow-sm bg-background hover:bg-muted transition-colors font-medium shrink-0 ml-2"
          >
            Pick this
          </button>
        )}
      </div>
      
      <div className="p-4 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground bg-background min-h-[80px]">
        {renderContent()}
      </div>

      {/* Metrics footer */}
      {status !== "failed" && !error && (
        <div className="border-t border-border/40 bg-background/50 px-4 py-3 font-mono text-[11px] text-muted-foreground">
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            <div className="flex items-center gap-2">
              <span className="opacity-70">first token</span>
              <span className={timeToFirstToken != null ? "font-medium text-foreground" : "opacity-50"}>
                {timeToFirstToken != null ? `${timeToFirstToken} ms` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">speed</span>
              <span className={tokensPerSecond != null ? "font-medium text-foreground" : "opacity-50"}>
                {tokensPerSecond != null ? `${tokensPerSecond} tok/s` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">tokens</span>
              <span className={totalTokens != null ? "font-medium text-foreground" : "opacity-50"}>
                {totalTokens != null ? totalTokens : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">cost</span>
              <span className="font-medium text-foreground">$0.0000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
