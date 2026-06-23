import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load local dev secrets first (.env.local wins), then any committed defaults.
// Mirrors Next.js env precedence so one `vercel env pull .env.local` feeds both.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
