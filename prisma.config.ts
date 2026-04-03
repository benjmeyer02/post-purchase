import "dotenv/config";
import { defineConfig, env } from "prisma/config";

process.env.DATABASE_URL ||= "file:./dev.sqlite";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
