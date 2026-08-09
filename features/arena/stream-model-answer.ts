import { parseJsonEventStream, readUIMessageStream, uiMessageChunkSchema, type UIMessage } from "ai";

export type StreamOutcome = "COMPLETE" | "FAILED";

export type ModelMetrics = {
  timeToFirstToken?: number | null;
  tokensPerSecond?: number | null;
  totalTokens?: number | null;
};

const extractText = (message: UIMessage): string => {
  if (!message.parts) return (message as any).content || "";
  return message.parts.reduce(
    (text, part) => (part.type === "text" ? text + part.text : text),
    "",
  );
};

export const streamModelAnswer = async (params: {
  readonly modelId: string;
  readonly turnId: string;
  readonly messages: any[];
  readonly onTextUpdate: (text: string) => void;
  readonly onMetricsUpdate?: (metrics: ModelMetrics) => void;
  readonly onDone: (status: StreamOutcome, metrics: ModelMetrics | null) => void;
}): Promise<void> => {
  try {
    const startTime = Date.now();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        modelId: params.modelId,
        turnId: params.turnId,
        messages: params.messages,
      }),
    });

    if (!response.ok || !response.body) {
      params.onDone("FAILED", null);
      return;
    }

    const chunkStream = parseJsonEventStream({
      stream: response.body,
      schema: uiMessageChunkSchema,
    }).pipeThrough(
      new TransformStream({
        transform(result, controller) {
          if (result.success) controller.enqueue(result.value);
        },
      }),
    );

    let failed = false;
    let metrics: ModelMetrics | null = null;
    let ttft: number | null = null;

    const messageStream = readUIMessageStream<UIMessage>({
      stream: chunkStream,
      onError: () => {
        failed = true;
      },
    });

    for await (const message of messageStream) {
      const text = extractText(message);
      
      if (text.length > 0 && ttft === null) {
        ttft = Date.now() - startTime;
      }
      
      const secondsElapsed = (Date.now() - startTime) / 1000;
      const approxTokens = Math.max(1, Math.floor(text.length / 4));
      const tps = secondsElapsed > 0.5 ? approxTokens / secondsElapsed : null;

      params.onTextUpdate(text);

      if (message.metadata) {
        metrics = message.metadata as ModelMetrics;
        if (params.onMetricsUpdate) params.onMetricsUpdate(metrics);
      } else if (params.onMetricsUpdate && ttft !== null) {
        params.onMetricsUpdate({
          timeToFirstToken: ttft,
          tokensPerSecond: tps ? parseFloat(tps.toFixed(1)) : null,
          totalTokens: approxTokens
        });
      }
    }

    params.onDone(failed ? "FAILED" : "COMPLETE", metrics);
  } catch (error) {
    console.error(`[arena] lost the stream for ${params.modelId}`, error);
    params.onDone("FAILED", null);
  }
};
