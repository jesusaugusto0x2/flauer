/**
 * Applies pending migrations from drizzle/ to the database in DATABASE_URL.
 *
 *   pnpm db:migrate
 *
 * Vercel runs it before every production build (see vercel.json), where
 * DATABASE_URL is available. Preview builds skip it: they share the same database.
 *
 * Uses Neon's HTTP driver (the same one the app uses) instead of drizzle-kit's
 * WebSocket connection, which can hang without printing an error.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
    console.log(
      `Skipping migrations on a ${process.env.VERCEL_ENV ?? "non-production"} build.`,
    );
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "✗ DATABASE_URL is missing. Locally, add it to .env.local; on Vercel, connect the Neon database (see README).",
    );
    process.exit(1);
  }

  const host = new URL(url).host;
  console.log(`Applying migrations to ${host}…`);
  await migrate(drizzle(neon(url)), { migrationsFolder: "drizzle" });
  console.log("✓ Migrations applied.");
}

main().catch((error) => {
  console.error("✗ Migration failed:");
  console.error(error);
  process.exit(1);
});
