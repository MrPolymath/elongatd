import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Initializing database...");

  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS "threads" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" timestamp NOT NULL,
        "author_id" text NOT NULL,
        "author_name" text NOT NULL,
        "author_username" text NOT NULL,
        "author_profile_image_url" text NOT NULL,
        "author_verified" boolean NOT NULL,
        "author_description" text NOT NULL,
        "author_followers_count" integer NOT NULL,
        "author_following_count" integer NOT NULL,
        "author_location" text,
        "author_created_at" timestamp NOT NULL,
        "author_url" text,
        "replies_count" integer NOT NULL,
        "retweets_count" integer NOT NULL,
        "likes_count" integer NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "tweets" (
        "id" text PRIMARY KEY NOT NULL,
        "thread_id" text NOT NULL,
        "text" text NOT NULL,
        "created_at" timestamp NOT NULL,
        "sequence" integer NOT NULL,
        "metrics_replies" integer NOT NULL,
        "metrics_retweets" integer NOT NULL,
        "metrics_likes" integer NOT NULL,
        "metrics_views" integer NOT NULL,
        "metrics_bookmarks" integer NOT NULL,
        "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "tweets_thread_id_threads_id_fk" 
          FOREIGN KEY ("thread_id") 
          REFERENCES "threads"("id") 
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "blogified_threads" (
        "thread_id" text PRIMARY KEY NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "version" integer DEFAULT 1 NOT NULL,
        "is_paid" boolean DEFAULT false NOT NULL,
        CONSTRAINT "blogified_threads_thread_id_threads_id_fk" 
          FOREIGN KEY ("thread_id") 
          REFERENCES "threads"("id") 
          ON DELETE CASCADE
      );
    `;

    console.log("✅ Database initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

main();
