"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Link2, Check } from "lucide-react";

const describe = (pathname: string): readonly string[] => {
  if (pathname === "/") return ["Arena"];
  if (pathname.startsWith("/t/")) return ["Arena", `Thread ${pathname.slice(3)}`];
  if (pathname.startsWith("/leaderboard")) return ["Leaderboard"];
  if (pathname.startsWith("/models")) return ["Models"];
  return ["Arena"];
};

const ShareButton = () => {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copyLink}
      className="border-input hover:bg-muted text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ml-4"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-green-500" />
          <span aria-live="polite">Copied</span>
        </>
      ) : (
        <>
          <Link2 className="size-3.5" />
          Copy link
        </>
      )}
    </button>
  );
};

export const TopBar = () => {
  const pathname = usePathname();
  const crumbs = describe(pathname);

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 shrink-0 z-10 absolute top-0 left-0 right-0">
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1 flex items-center">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground font-medium">
          {crumbs.map((crumb, index) => (
            <li key={crumb} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <span className="text-muted-foreground/60" aria-hidden>
                  /
                </span>
              )}
              <span
                className={index === crumbs.length - 1 ? "text-foreground" : "truncate"}
                aria-current={index === crumbs.length - 1 ? "page" : undefined}
              >
                {crumb}
              </span>
            </li>
          ))}
        </ol>
        
        {pathname.startsWith("/t/") && <ShareButton />}
      </nav>
    </header>
  );
};
