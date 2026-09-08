"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Avoid hydration mismatch by only rendering after mount.
  // useSyncExternalStore has no effect/setState, so it satisfies the
  // react-hooks/set-state-in-effect rule while keeping the same behavior.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <button className="p-2 rounded-full border border-border hover:bg-secondary transition-all-150">
        <span className="w-5 h-5 block" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full border border-border hover:bg-secondary transition-all-150"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-muted-foreground" />
      ) : (
        <Moon size={20} className="text-muted-foreground" />
      )}
    </button>
  );
}
