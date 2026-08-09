"use client";

import { useState } from "react";
import { type UIMessage } from "ai";
import { ModelResponseCard } from "./model-response-card";
import { StreamingModelResponseCard } from "./streaming-model-response-card";
import { castVoteAction } from "@/lib/actions/vote";

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
}

interface TurnViewProps {
  turn: TurnData;
  historicalTurns: TurnData[];
}

import { buildModelMessages } from "../model-messages";

export function TurnView({ turn, historicalTurns }: TurnViewProps) {
  const [completedStreams, setCompletedStreams] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(!!turn.vote);
  const [winnerId, setWinnerId] = useState<string | null>(turn.vote?.winnerModelId || null);

  const isStreamingTurn = turn.responses.some(r => r.status === "streaming");

  // A vote is allowed if:
  // 1. It hasn't been voted on yet
  // 2. Either it's a historical turn (not streaming) OR at least 2 streams have completed
  const canVote = !hasVoted && (!isStreamingTurn || completedStreams.size >= 2);

  const handleVote = async (modelId: string) => {
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

          if (response.status === "streaming") {
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
                onFinish={(status) => {
                  if (status === "complete") {
                    setCompletedStreams(prev => new Set([...Array.from(prev), response.modelId]));
                  }
                }}
              />
            );
          }

          // Historical or completely failed
          return (
            <ModelResponseCard
              key={response.id}
              modelId={response.modelId}
              modelName={response.modelNameSnapshot}
              status={response.status as "complete" | "failed"}
              text={response.text || undefined}
              timeToFirstToken={response.timeToFirstToken}
              tokensPerSecond={response.tokensPerSecond}
              totalTokens={response.totalTokens}
              canVote={canVote && !hasVoted}
              isWinner={isWinner}
              onVote={() => handleVote(response.modelId)}
            />
          );
        })}
      </div>

      {/* Voting Hint */}
      {!hasVoted && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          Two or more models answered, so this turn can be voted on. Picking one marks it the winner and leaves every answer on screen.
        </div>
      )}
    </div>
  );
}
