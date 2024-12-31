ALTER TABLE "threads" RENAME COLUMN "total_metrics_replies" TO "replies_count";--> statement-breakpoint
ALTER TABLE "threads" RENAME COLUMN "total_metrics_retweets" TO "retweets_count";--> statement-breakpoint
ALTER TABLE "threads" RENAME COLUMN "total_metrics_likes" TO "likes_count";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN IF EXISTS "total_metrics_views";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN IF EXISTS "total_metrics_bookmarks";