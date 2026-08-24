import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config();

const rawUrl = process.env.DATABASE_URL || "./db/dev.db";
const url = rawUrl.startsWith("file:") ? rawUrl : `file:${rawUrl}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
});
