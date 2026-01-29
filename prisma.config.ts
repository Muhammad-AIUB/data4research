import { config } from "dotenv";
import { resolve } from "path";

// Load .env file
config({ path: resolve(process.cwd(), ".env") });

const prismaConfig = {
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
};

export default prismaConfig;
