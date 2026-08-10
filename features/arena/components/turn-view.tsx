"use client";

import { useState } from "react";
import { type UIMessage } from "ai";
import { ModelResponseCard } from "./model-response-card";
import { StreamingModelResponseCard } from "./streaming-model-response-card";
import { castVoteAction } from "@/lib/actions/vote";
import { useClerk } from "@clerk/nextjs";

export interface TurnResponse {
  id: string;
  modelId: string;
  modelNameSnapshot: string;
  status: string;
  text?: string | null;
  timeToFirstToken?: number | null;
  tokensPerSecond?: number | null;
  totalTokens?: number | null;
}

export interface TurnData {
  id: string;
  prompt: string;
  responses: TurnResponse[];
  vote?: { winnerModelId: string } | null;
  createdAt: string;
}

interface TurnViewProps {
  turn: TurnData;
  historicalTurns: TurnData[];
  /** True only when the current viewer owns this thread. Controls whether streaming fires. */
  isOwner?: boolean;
  /** Whether the current viewer is signed in. Controls vote button behavior. */
  isSignedIn?: boolean;
}

import { buildModelMessages } from "../model-messages";

export function TurnView({ turn, historicalTurns, isOwner = false, isSignedIn = false }: TurnViewProps) {
  const clerk = useClerk();
  const [completedStreams, setCompletedStreams] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(!!turn.vote);
  const [winnerId, setWinnerId] = useState<string | null>(turn.vote?.winnerModelId || null);

  /**
   * Non-owners never trigger streaming. This mirrors the demo's approach exactly:
   * if (!isOwner) return in the streaming effect.
   * A response stored as "streaming" in the DB is treated as "failed" for non-owners
   * so they see the stored text (or a failed state) rather than re-triggering a stream.
   */
  const effectiveStatus = (response: TurnResponse) => {
    if (!isOwner && response.status === "streaming") return "failed";
    return response.status;
  };

  const isStreamingTurn = isOwner && turn.responses.some(r => r.status === "streaming");

  // A vote is allowed if:
  // 1. It hasn't been voted on yet
  // 2. Either it's a historical turn (not streaming) OR at least 2 streams have completed
  const canVote = !hasVoted && (!isStreamingTurn || completedStreams.size >= 2);

  const handleVote = async (modelId: string) => {
    // Non-logged-in users → open sign in modal
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    if (!canVote) return;
    setHasVoted(true);
    setWinnerId(modelId);
    try {
      await castVoteAction(turn.id, modelId);
    } catch (e) {
      console.error("Failed to cast vote", e);
      setHasVoted(false);
      setWinnerId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto mb-12">
      {/* Prompt Bubble */}
      <div className="self-end max-w-2xl bg-secondary/60 text-foreground px-5 py-4 rounded-3xl rounded-tr-md shadow-sm border border-border/40 text-[15px] leading-relaxed whitespace-pre-wrap">
        {turn.prompt}
      </div>

      {/* Model Responses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turn.responses.map((response) => {
          const isWinner = winnerId === response.modelId;
          const status = effectiveStatus(response);

          // Only trigger live streaming for the owner
          if (isOwner && status === "streaming") {
            return (
              <StreamingModelResponseCard
                key={response.id}
                turnId={turn.id}
                modelId={response.modelId}
                modelName={response.modelNameSnapshot}
                initialMessages={buildModelMessages(historicalTurns, response.modelId)}
                prompt={turn.prompt}
                canVote={canVote && !hasVoted}
                isWinner={isWinner}
                onVote={() => handleVote(response.modelId)}
                onFinish={(s) => {
                  if (s === "complete") {
                    setCompletedStreams(prev => new Set([...Array.from(prev), response.modelId]));
                  }
                }}
              />
            );
          }

          // For non-owners or completed/failed: show stored text from DB
          return (
            <ModelResponseCard
              key={response.id}
              modelId={response.modelId}
              modelName={response.modelNameSnapshot}
              status={status as "complete" | "failed"}
              text={response.text || undefined}
              timeToFirstToken={response.timeToFirstToken}
              tokensPerSecond={response.tokensPerSecond}
              totalTokens={response.totalTokens}
              canVote={canVote}
              isWinner={isWinner}
              onVote={() => handleVote(response.modelId)}
            />
          );
        })}
      </div>

      {/* Voting hint — only show when a vote is possible */}
      {canVote && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          {isSignedIn
            ? "Pick the best answer — your vote marks the winner."
            : "Sign in to vote on this thread."}
        </div>
      )}
    </div>
  );
}
