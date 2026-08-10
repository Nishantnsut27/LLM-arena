import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogIn, Trophy, Layers, MessageSquare, Menu } from "lucide-react";
import { prisma } from "@/lib/db";
import { listThreadHistory } from "@/features/shell/thread-history";
import { TopBar } from "@/components/top-bar";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  
  let threadGroups: any[] = [];
  if (userId) {
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (dbUser) {
      threadGroups = (await listThreadHistory(dbUser.id)) as any[];
    }
  }

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Custom Sidebar */}
      <aside className="w-[260px] border-r border-border bg-background flex flex-col hidden md:flex h-full">
        <div className="p-4 py-6 shrink-0">
          <Link href="/" className="font-serif text-2xl tracking-tight px-2">
            LLM Arena
          </Link>
        </div>

        {/* Main Nav (Fixed) */}
        <nav className="px-4 py-2 space-y-0.5 shrink-0">
          <NavItem href="/" icon={<Menu size={18} />} label="Arena" active />
          <NavItem href="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" />
          <NavItem href="/models" icon={<Layers size={18} />} label="Models" />
        </nav>

        {/* Thread List (Scrollable) */}
        <div className="pt-6 px-4 flex-1 overflow-y-auto min-h-0 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 mb-3 shrink-0">Your Threads</h4>
          
          {userId ? (
            <div className="space-y-4">
              {threadGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 leading-relaxed shrink-0">
                  No threads yet. Start a conversation in the Arena!
                </p>
              ) : (
                threadGroups.map((group) => (
                  <div key={group.label}>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-4">
                      {group.label}
                    </h5>
                    <div className="space-y-0.5">
                      {group.threads.map((thread: any) => (
                        <ThreadItem
                          key={thread.id}
                          href={`/t/${thread.id}`}
                          label={thread.title}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="px-2 shrink-0">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Sign in to keep your threads and vote on answers.
              </p>
              <SignInButton mode="modal">
                <button className="text-sm font-medium border border-border px-4 py-1.5 rounded hover:bg-secondary/50 transition-all-150">
                  Sign in
                </button>
              </SignInButton>
            </div>
          )}
        </div>

        {/* Footer (Fixed) */}
        <div className="p-4 border-t border-border flex items-center justify-between shrink-0 bg-background">
          <div className="flex items-center gap-2">
            {userId && (
              <UserButton appearance={{ elements: { userButtonBox: "h-8 w-8" } }} />
            )}
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-2 md:p-4 flex flex-col min-w-0 h-full">
        <div className="flex-1 bg-background border border-border shadow-sm rounded-xl flex flex-col overflow-hidden min-h-0 relative">
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto mt-14 h-full relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all-150 ${active ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function ThreadItem({ href, label }: { href: string; label: string }) {
  return (
    <Link 
      href={href}
      className="block truncate px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all-150"
    >
      {label}
    </Link>
  );
}
