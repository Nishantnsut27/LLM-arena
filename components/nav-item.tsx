"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  const pathname = usePathname();
  // "/" (Arena) must match exactly; the rest match their section prefix so
  // nested routes (e.g. /leaderboard?view=me) stay highlighted.
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all-150 ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
    >
      {icon}
      {label}
    </Link>
  );
}
