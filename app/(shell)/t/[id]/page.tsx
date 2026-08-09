import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TurnView, type TurnData } from "@/features/arena/components/turn-view";
import { ArenaComposer } from "@/features/arena/components/arena-composer";
import { getFreeModels } from "@/lib/infrastructure/model-catalog";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await params;
  const { userId: clerkId } = await auth();
  
  // Find the thread
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      turns: {
        orderBy: { createdAt: "asc" },
        include: {
          responses: true,
          vote: true
        }
      }
    }
  });

  if (!thread) notFound();

  // If a user is signed in, we can optionally restrict composer access to only the thread owner.
  // We'll just load the catalog so ArenaComposer has it (though it won't be used since models are locked).
  const catalog = await getFreeModels();

  const turns: TurnData[] = thread.turns.map(turn => ({
    id: turn.id,
    prompt: turn.prompt,
    vote: turn.vote ? { winnerModelId: turn.vote.winnerModelId } : null,
    responses: turn.responses.map(res => ({
      id: res.id,
      modelId: res.modelId,
      modelNameSnapshot: res.modelNameSnapshot,
      status: res.status,
      text: res.text,
      timeToFirstToken: res.timeToFirstToken,
      tokensPerSecond: res.tokensPerSecond ? Number(res.tokensPerSecond) : null,
      totalTokens: res.totalTokens
    }))
  }));

  const defaultSelection = turns.length > 0 
    ? turns[turns.length - 1].responses.map(r => r.modelId) 
    : [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] relative">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {turns.map((turn, index) => (
          <TurnView 
            key={turn.id}
            turn={turn}
            historicalTurns={turns.slice(0, index)}
          />
        ))}
      </div>
      
      {/* Floating sticky composer at bottom */}
      <div className="bg-background/85 sticky bottom-4 px-4 pt-2 pb-4 backdrop-blur-md sm:px-6 w-full max-w-4xl mx-auto rounded-3xl border border-border/50 shadow-lg shadow-black/5 z-10">
        <div className="surface mx-auto w-full p-2">
          <ArenaComposer catalog={catalog} threadId={thread.id} defaultSelection={defaultSelection} />
        </div>
      </div>
    </div>
  );
}
