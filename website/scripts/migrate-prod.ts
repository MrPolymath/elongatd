import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";

// Load production environment variables
dotenv.config({ path: ".env.local" });

async function main() {
  try {
    console.log("Adding added_at column to threads table...");

    // Add the column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'threads' 
          AND column_name = 'added_at'
        ) THEN 
          ALTER TABLE threads 
          ADD COLUMN added_at timestamp DEFAULT now() NOT NULL;
        END IF;
      END $$;
    `;

    // Update existing rows to have added_at = created_at
    await sql`
      UPDATE threads 
      SET added_at = created_at 
      WHERE added_at IS NULL OR added_at = now();
    `;

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  process.exit(0);
}

main();
