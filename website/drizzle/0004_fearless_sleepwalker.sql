ALTER TABLE "blogified_threads" DROP CONSTRAINT "blogified_threads_thread_id_threads_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blogified_threads" ADD CONSTRAINT "blogified_threads_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
