ALTER TABLE "threads" ADD COLUMN "added_at" timestamp DEFAULT now() NOT NULL;