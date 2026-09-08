import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireEnv } from "./env";

/**
 * A single pg pool is cached alongside the client. Without this, every module
 * re-evaluation (dev HMR) creates a new pool while the cached PrismaClient keeps
 * its original one, so queries fail with "Server has closed the connection" once
 * the hosted pooler drops those idle sockets.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createPool(): Pool {
  const pool = new Pool({
    connectionString: requireEnv("DATABASE_URL"),
    max: 5,
    // Recycle our own idle connections before the hosted pooler closes them.
    idleTimeoutMillis: 10_000,
    keepAlive: true,
  });

  // An idle connection dropped by the server must not crash the process.
  pool.on("error", (error) => {
    console.error("[db] idle connection error", error.message);
  });

  return pool;
}

const pool = globalForPrisma.pool ?? createPool();
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
