import { PrismaClient } from "@prisma/client";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const rawUrl = process.env.DATABASE_URL || "file:./db/dev.db";
const url = rawUrl.startsWith("file:") ? rawUrl : `file:${rawUrl}`;

// const libsql = createClient({ url });
const adapter = new PrismaLibSql({ url });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
