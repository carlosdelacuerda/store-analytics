import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Neon's free-tier compute can suspend after inactivity ("cold start"),
    // adding several seconds of latency to the first query after a quiet
    // period. Prisma's default interactive transaction timeout (5s) is too
    // short for that, and a timed-out transaction shows up as a confusing
    // "Transaction not found" error on the next statement. These defaults
    // give transactions more breathing room; call sites that do extra work
    // also set explicit options for clarity.
    transactionOptions: {
      maxWait: 10000,
      timeout: 20000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
