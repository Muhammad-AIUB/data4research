import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Prefer the direct (non-pooled) URL for CLI operations like migrate;
    // fall back to the pooled DATABASE_URL so prisma generate works without it.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
  migrations: {
    seed: "npm run seed",
  },
});
