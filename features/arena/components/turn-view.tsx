"use client";

import { useState } from "react";
import { ModelResponseCard } from "./model-response-card";
import { StreamingModelResponseCard } from "./streaming-model-response-card";
import { castVoteAction } from "@/lib/actions/vote";
import { retryModelResponseAction } from "@/lib/actions/thread";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export interface TurnResponse {
  id: string;
  modelId: string;
  modelNameSnapshot: string;
  status: string;
  text?: string | null;
  timeToFirstToken?: number | null;
  tokensPerSecond?: number | null;
  totalTokens?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costUsd?: number | null;
  isFree?: boolean;
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
  const router = useRouter();
  const [completedStreams, setCompletedStreams] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(!!turn.vote);
  const [winnerId, setWinnerId] = useState<string | null>(turn.vote?.winnerModelId || null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [retryingModelId, setRetryingModelId] = useState<string | null>(null);

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

  const completedResponseCount = turn.responses.filter((response) => response.status === "complete").length;
  // A vote is allowed if:
  // 1. It hasn't been voted on yet
  // 2. Either it's a historical turn (not streaming) OR at least 2 streams have completed
  const canVote = !hasVoted && completedResponseCount + completedStreams.size >= 2;

  const handleVote = async (modelId: string) => {
    // Non-logged-in users → open sign in modal
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    if (!canVote) return;
    setVoteError(null);
    setHasVoted(true);
    setWinnerId(modelId);
    try {
      await castVoteAction(turn.id, modelId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Your vote could not be recorded.";
      setVoteError(message);
      console.error("Failed to cast vote", e);
      setHasVoted(false);
      setWinnerId(null);
      router.refresh();
    }
  };

  const handleRetry = async (modelId: string) => {
    if (!isOwner || retryingModelId) return;
    setRetryingModelId(modelId);
    try {
      await retryModelResponseAction(turn.id, modelId);
      router.refresh();
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : "This response could not be retried.");
    } finally {
      setRetryingModelId(null);
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
                onRetry={() => handleRetry(response.modelId)}
                isFree={response.isFree}
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
              inputTokens={response.inputTokens}
              outputTokens={response.outputTokens}
              estimatedCost={response.costUsd}
              isFree={response.isFree}
              canVote={canVote}
              isWinner={isWinner}
              onVote={() => handleVote(response.modelId)}
              onRetry={response.status === "failed" && isOwner ? () => handleRetry(response.modelId) : undefined}
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
      {voteError && <p role="alert" className="text-center text-sm text-destructive">{voteError}</p>}
      {hasVoted && winnerId && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm">
          <div className="font-semibold text-primary">🏆 You picked {turn.responses.find((response) => response.modelId === winnerId)?.modelNameSnapshot ?? winnerId}</div>
          <div className="text-muted-foreground">Your vote has been recorded and is final.</div>
        </div>
      )}
    </div>
  );
}
