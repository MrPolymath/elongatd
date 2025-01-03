ALTER TABLE "blogified_threads" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "user_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "user_image" text NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "output_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "total_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "input_cost_per_1m_tokens_cents" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "output_cost_per_1m_tokens_cents" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "input_cost_millicents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "output_cost_millicents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blogified_threads" ADD COLUMN "total_cost_millicents" integer DEFAULT 0 NOT NULL;