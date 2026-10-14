/**
 * Applies pending migrations from drizzle/ to the database in DATABASE_URL.
 *
 *   pnpm db:migrate
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
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is missing. Add it to .env.local (see README).");
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
