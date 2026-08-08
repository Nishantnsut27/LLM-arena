import arcjet, { shield, detectBot } from "@arcjet/next";
import { requireEnv } from "@/lib/env";

export const aj = arcjet({
  key: requireEnv("ARCJET_KEY"),
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [], // block all bots by default
    }),
  ],
});
