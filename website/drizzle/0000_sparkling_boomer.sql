CREATE TABLE IF NOT EXISTS "replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"text" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"text" text NOT NULL,
	"replies_count" integer NOT NULL,
	"retweets_count" integer NOT NULL,
	"likes_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replies" ADD CONSTRAINT "replies_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
