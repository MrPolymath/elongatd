-- Drop old columns from threads first
ALTER TABLE "threads" DROP COLUMN IF EXISTS "timestamp";
ALTER TABLE "threads" DROP COLUMN IF EXISTS "text";
ALTER TABLE "threads" DROP COLUMN IF EXISTS "replies_count";
ALTER TABLE "threads" DROP COLUMN IF EXISTS "retweets_count";
ALTER TABLE "threads" DROP COLUMN IF EXISTS "likes_count";

-- Rename replies table to tweets
ALTER TABLE "replies" RENAME TO "tweets";
ALTER TABLE "tweets" DROP CONSTRAINT "replies_thread_id_threads_id_fk";

-- Update tweets table structure
ALTER TABLE "tweets" ALTER COLUMN "id" SET DATA TYPE text;
ALTER TABLE "tweets" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "tweets" DROP COLUMN IF EXISTS "timestamp";
ALTER TABLE "tweets" ADD COLUMN "metrics_replies" integer NOT NULL DEFAULT 0;
ALTER TABLE "tweets" ADD COLUMN "metrics_retweets" integer NOT NULL DEFAULT 0;
ALTER TABLE "tweets" ADD COLUMN "metrics_likes" integer NOT NULL DEFAULT 0;
ALTER TABLE "tweets" ADD COLUMN "metrics_views" integer NOT NULL DEFAULT 0;
ALTER TABLE "tweets" ADD COLUMN "metrics_bookmarks" integer NOT NULL DEFAULT 0;
ALTER TABLE "tweets" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "tweets" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;

-- Add foreign key back
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_thread_id_threads_id_fk" 
  FOREIGN KEY ("thread_id") REFERENCES "threads"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Update threads table structure
ALTER TABLE "threads" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "threads" RENAME COLUMN "username" TO "author_username";

-- Add new author fields
ALTER TABLE "threads" ADD COLUMN "author_id" text NOT NULL DEFAULT '';
ALTER TABLE "threads" ADD COLUMN "author_name" text NOT NULL DEFAULT '';
ALTER TABLE "threads" ADD COLUMN "author_profile_image_url" text NOT NULL DEFAULT '';
ALTER TABLE "threads" ADD COLUMN "author_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "threads" ADD COLUMN "author_description" text NOT NULL DEFAULT '';
ALTER TABLE "threads" ADD COLUMN "author_followers_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "threads" ADD COLUMN "author_following_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "threads" ADD COLUMN "author_location" text;
ALTER TABLE "threads" ADD COLUMN "author_created_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "threads" ADD COLUMN "author_url" text;

-- Add metrics fields
ALTER TABLE "threads" ADD COLUMN "total_metrics_replies" integer NOT NULL DEFAULT 0;
ALTER TABLE "threads" ADD COLUMN "total_metrics_retweets" integer NOT NULL DEFAULT 0;
ALTER TABLE "threads" ADD COLUMN "total_metrics_likes" integer NOT NULL DEFAULT 0;
ALTER TABLE "threads" ADD COLUMN "total_metrics_views" integer NOT NULL DEFAULT 0;
ALTER TABLE "threads" ADD COLUMN "total_metrics_bookmarks" integer NOT NULL DEFAULT 0;

-- Add system fields
ALTER TABLE "threads" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;

-- Remove defaults after migration
ALTER TABLE "threads" ALTER COLUMN "author_id" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_name" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_profile_image_url" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_verified" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_description" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_followers_count" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_following_count" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "author_created_at" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "total_metrics_replies" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "total_metrics_retweets" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "total_metrics_likes" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "total_metrics_views" DROP DEFAULT;
ALTER TABLE "threads" ALTER COLUMN "total_metrics_bookmarks" DROP DEFAULT;