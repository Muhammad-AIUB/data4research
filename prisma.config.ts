import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    // Prisma CLI operations should bypass PgBouncer and use the direct connection.
    url: env("DIRECT_DATABASE_URL"),
  },
  migrations: {
    seed: "npm run seed",
  },
});
