"use client";

import { useCallback, useRef, useState } from "react";

const DEFAULT_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
];

type ModelRuntime = {
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  errorText: string | null;
  firstTokenMs: number | null;
  tokensPerSecond: number | null;
  totalTokens: number | null;
};

type FinishMetadata = {
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  timingMs?: number;
  firstTokenMs?: number | null;
  tokensPerSecond?: number | null;
};

type ModelMetadata = FinishMetadata;

const emptyRun = (): ModelRuntime => ({
  text: "",
  status: "idle",
  errorText: null,
  firstTokenMs: null,
  tokensPerSecond: null,
  totalTokens: null,
});

function parseStreamPart(data: string): Record<string, unknown> | null {
  if (data === "[DONE]") return null;
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);
  const [runs, setRuns] = useState<ModelRuntime[]>(models.map(emptyRun));
  const [sending, setSending] = useState(false);
  const abortRefs = useRef<AbortController[]>([]);

  const patchRun = useCallback(
    (index: number, patch: Partial<ModelRuntime> | ((prev: ModelRuntime) => Partial<ModelRuntime>)) => {
      setRuns(prev =>
        prev.map((run, i) =>
          i === index ? { ...run, ...(typeof patch === "function" ? patch(run) : patch) } : run,
        ),
      );
    },
    [],
  );

  const send = useCallback(async () => {
    if (prompt.trim().length === 0 || sending) return;

    setSending(true);
    setRuns(models.map(emptyRun));

    const controllers = models.map(() => new AbortController());
    abortRefs.current = controllers;

    await Promise.all(
      models.map(async (model, index) => {
        const startedAt = performance.now();
        let firstTokenAt: number | null = null;

        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
            }),
            signal: controllers[index].signal,
          });

          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { error?: string } | null;
            patchRun(index, {
              status: "error",
              errorText: body?.error ?? "That request didn't go through, please try again.",
            });
            return;
          }

          if (!response.body) {
            patchRun(index, { status: "error", errorText: "No answer came back, please try again." });
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let separatorIndex: number;
            while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
              const raw = buffer.slice(0, separatorIndex);
              buffer = buffer.slice(separatorIndex + 2);
              const line = raw.trim();
              if (!line.startsWith("data: ")) continue;

              const chunk = parseStreamPart(line.slice(6));
              if (chunk === null) continue;

              if (chunk.type === "text-delta") {
                if (firstTokenAt === null) firstTokenAt = performance.now();
                const tokenAt = firstTokenAt;
                patchRun(index, prev => ({
                  status: "streaming",
                  firstTokenMs: tokenAt - startedAt,
                  text: prev.text + String(chunk.delta ?? ""),
                }));
              } else if (chunk.type === "error") {
                patchRun(index, {
                  status: "error",
                  errorText: String(chunk.errorText ?? "That model couldn't finish, please try again."),
                });
              } else if (chunk.type === "finish") {
                const metadata = (chunk.messageMetadata ?? {}) as ModelMetadata;
                patchRun(index, {
                  status: "done",
                  totalTokens: metadata.usage?.totalTokens ?? null,
                  tokensPerSecond: metadata.tokensPerSecond ?? null,
                  firstTokenMs: metadata.firstTokenMs ?? null,
                });
              }
            }
          }
        } catch (error) {
          if ((error as Error).name === "AbortError") return;
          patchRun(index, {
            status: "error",
            errorText: "That model couldn't answer right now. Please try again.",
          });
        }
      }),
    );

    setSending(false);
  }, [models, prompt, sending, patchRun]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">LLM Arena</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="prompt" className="text-sm font-medium">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          rows={3}
          className="rounded border border-zinc-300 p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Ask the models anything."
        />
        <div className="flex flex-wrap gap-4">
          {models.map((model, index) => (
            <label key={model} className="flex items-center gap-2 text-sm">
              <input
                type="text"
                value={models[index]}
                onChange={event =>
                  setModels(prev => prev.map((next, i) => (i === index ? event.target.value : next)))
                }
                className="w-64 rounded border border-zinc-300 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          ))}
        </div>
        <div>
          <button
            type="button"
            onClick={send}
            disabled={sending || prompt.trim().length === 0}
            className="rounded bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
          >
            {sending ? "Running…" : "Run all"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {models.map((model, index) => {
          const run = runs[index] ?? emptyRun();
          return (
            <section
              key={model}
              className="flex min-h-72 flex-col rounded border border-zinc-300 p-4 dark:border-zinc-700"
            >
              <h2 className="mb-2 truncate text-sm font-semibold">{model}</h2>
              <p className="flex-1 whitespace-pre-wrap text-sm leading-6">
                {run.text || (run.status === "streaming" ? "…" : "")}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {run.status === "error" && <span className="text-red-600 dark:text-red-400">{run.errorText}</span>}
                {run.status === "done" && run.totalTokens !== null && (
                  <span>{run.totalTokens} tokens</span>
                )}
                {run.status === "done" && run.firstTokenMs !== null && (
                  <span>first token {run.firstTokenMs} ms</span>
                )}
                {run.status === "done" && run.tokensPerSecond !== null && (
                  <span>{run.tokensPerSecond} tok/s</span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}