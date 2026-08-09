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
  readonly onDone: (status: StreamOutcome, metrics: ModelMetrics | null) => void;
}): Promise<void> => {
  try {
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

    const messageStream = readUIMessageStream<UIMessage>({
      stream: chunkStream,
      onError: () => {
        failed = true;
      },
    });

    for await (const message of messageStream) {
      params.onTextUpdate(extractText(message));
      if (message.metadata) {
        metrics = message.metadata as ModelMetrics;
      }
    }

    params.onDone(failed ? "FAILED" : "COMPLETE", metrics);
  } catch (error) {
    console.error(`[arena] lost the stream for ${params.modelId}`, error);
    params.onDone("FAILED", null);
  }
};
