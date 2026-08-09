import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogIn, Trophy, Layers, MessageSquare, Menu } from "lucide-react";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Custom Sidebar */}
      <aside className="w-[260px] border-r border-border bg-background flex flex-col hidden md:flex">
        <div className="p-4 py-6">
          <Link href="/" className="font-serif text-2xl tracking-tight px-2">
            LLM Arena
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8">
          {/* Main Nav */}
          <div className="space-y-0.5">
            <NavItem href="/" icon={<Menu size={18} />} label="Arena" active />
            <NavItem href="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" />
            <NavItem href="/models" icon={<Layers size={18} />} label="Models" />
          </div>

          {/* Thread List Placeholder / Auth Gate */}
          <div className="pt-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 mb-3">Your Threads</h4>
            
            {userId ? (
              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-4">Today</h5>
                  <div className="space-y-0.5">
                    <ThreadItem href="/t/placeholder-1" label="Claude vs Nemotron" />
                    <ThreadItem href="/t/placeholder-2" label="React useActionState" />
                  </div>
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-4">Previous 7 Days</h5>
                  <div className="space-y-0.5">
                    <ThreadItem href="/t/placeholder-3" label="Fixing PostgreSQL connection" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-2">
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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {userId ? (
              <UserButton appearance={{ elements: { userButtonBox: "h-8 w-8" } }} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-serif text-sm font-medium">
                N
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 sticky top-0 z-10">
          <div className="text-sm font-medium text-muted-foreground">
            Arena
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
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
