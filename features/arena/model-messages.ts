import type { UIMessage } from "ai";
import type { TurnData } from "./components/turn-view";

export const buildModelMessages = (
  turns: TurnData[],
  modelId: string,
): UIMessage[] => {
  return turns.flatMap((turn): UIMessage[] => {
    const prompt: UIMessage = { 
      id: `prompt-${turn.id}`, 
      role: "user", 
      parts: [{ type: "text", text: turn.prompt }]
    };

    const answer = turn.responses.find(
      (response) => response.modelId === modelId && response.status === "complete"
    );

    if (answer && answer.text) {
      return [
        prompt, 
        { 
          id: `answer-${answer.id}`, 
          role: "assistant", 
          parts: [{ type: "text", text: answer.text }]
        }
      ];
    }

    // If the model didn't answer (failed or still streaming), we still include the prompt it saw.
    return [prompt];
  });
};
