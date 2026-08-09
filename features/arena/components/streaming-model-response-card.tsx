"use client";

import { useEffect, useRef, useState } from "react";
import { ModelResponseCard } from "./model-response-card";
import { type UIMessage } from "ai";
import { streamModelAnswer, type StreamOutcome, type ModelMetrics } from "../stream-model-answer";

interface StreamingModelResponseCardProps {
  turnId: string;
  modelId: string;
  modelName: string;
  initialMessages: UIMessage[];
  prompt: string;
  onFinish?: () => void;
  canVote?: boolean;
  isWinner?: boolean;
  onVote?: () => void;
}

export function StreamingModelResponseCard({
  turnId,
  modelId,
  modelName,
  initialMessages,
  prompt,
  onFinish,
  canVote,
  isWinner,
  onVote
}: StreamingModelResponseCardProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [status, setStatus] = useState<"streaming" | "complete" | "failed">("streaming");
  const [text, setText] = useState("");
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);

  const inFlight = useRef(false);

  useEffect(() => {
    if (!hasStarted && !inFlight.current) {
      setHasStarted(true);
      inFlight.current = true;

      const messages = [...initialMessages, { role: "user", content: prompt }];

      streamModelAnswer({
        modelId,
        turnId,
        messages,
        onTextUpdate: (newText) => {
          setText(newText);
        },
        onMetricsUpdate: (liveMetrics) => {
          setMetrics(liveMetrics);
        },
        onDone: (outcome, finalMetrics) => {
          setStatus(outcome === "COMPLETE" ? "complete" : "failed");
          if (finalMetrics) {
            setMetrics(finalMetrics);
          }
          inFlight.current = false;
          onFinish?.();
        }
      });
    }
  }, [hasStarted, modelId, turnId, prompt, initialMessages, onFinish]);

  const isLoading = status === "streaming";
  
  // Transform the plain text into an AI SDK v7 UIMessage-like structure
  // so ModelResponseCard can render it seamlessly.
  const messagesMock = [{
    id: `temp-${modelId}`,
    role: "assistant" as const,
    parts: [{ type: "text" as const, text }]
  }];

  return (
    <ModelResponseCard
      modelId={modelId}
      modelName={modelName}
      status={status}
      messages={messagesMock}
      error={status === "failed" ? new Error("Failed") : undefined}
      isLoading={isLoading}
      canVote={canVote}
      isWinner={isWinner}
      onVote={onVote}
      timeToFirstToken={metrics?.timeToFirstToken}
      tokensPerSecond={metrics?.tokensPerSecond}
      totalTokens={metrics?.totalTokens}
    />
  );
}
