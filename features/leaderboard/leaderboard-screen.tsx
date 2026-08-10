"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import type { LeaderboardRow } from "./leaderboard-standings";

interface LeaderboardScreenProps {
  rows: LeaderboardRow[];
  view: "global" | "personal";
  isSignedIn: boolean;
}

export function LeaderboardScreen({ rows, view, isSignedIn }: LeaderboardScreenProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold mb-4">Leaderboard</h1>
      <p className="text-muted-foreground mb-8 text-lg max-w-2xl">
        Every model's real record, from actual head-to-head votes. No benchmark, no
        vendor claim, just what people picked when they saw the answers side by side.
      </p>

      {/* Segmented Control */}
      <div className="inline-flex bg-muted p-1 rounded-full mb-8">
        <Link
          href="/leaderboard"
          aria-current={view === "global" ? "page" : undefined}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            view === "global"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Everyone
        </Link>
        <Link
          href="/leaderboard?view=me"
          aria-current={view === "personal" ? "page" : undefined}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            view === "personal"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Just me
        </Link>
      </div>

      {view === "personal" && !isSignedIn ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4">Sign in to see your personal leaderboard.</p>
          <SignInButton mode="modal">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">#</th>
                  <th className="px-6 py-4 font-semibold">Model</th>
                  <th className="px-6 py-4 font-semibold text-right">Win Rate</th>
                  <th className="px-6 py-4 font-semibold text-right">To First Token</th>
                  <th className="px-6 py-4 font-semibold text-right">Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No completed battles found yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.modelId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium uppercase border border-border">
                            {row.modelName.charAt(0)}
                          </div>
                          <span className="font-medium">{row.modelName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-primary">
                            {Math.round(row.winRate * 100)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            won {row.wins} of {row.total}
                          </span>
                        </div>
                        <div className="w-full bg-muted h-1 mt-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.round(row.winRate * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {row.avgTimeToFirstToken ? `${row.avgTimeToFirstToken} ms` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {row.avgTokensPerSecond ? `${row.avgTokensPerSecond} tok/s` : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
        Speed is wall clock, request to finish, so a model that buffers its whole answer and a model
        that streams token by token can sit in the same column honestly. Time to first token is measured
        separately and shown beside it.
      </p>
    </div>
  );
}
