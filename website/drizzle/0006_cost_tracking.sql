ALTER TABLE "blogified_threads"
  -- User tracking
  ADD COLUMN "user_id" text NOT NULL,
  ADD COLUMN "user_name" text NOT NULL,
  ADD COLUMN "user_image" text NOT NULL,
  -- Token usage tracking
  ADD COLUMN "input_tokens" integer NOT NULL DEFAULT 0,
  ADD COLUMN "output_tokens" integer NOT NULL DEFAULT 0,
  ADD COLUMN "total_tokens" integer NOT NULL DEFAULT 0,
  -- Cost rates per 1M tokens (in cents)
  ADD COLUMN "input_cost_per_1m_tokens_cents" integer NOT NULL DEFAULT 15,
  ADD COLUMN "output_cost_per_1m_tokens_cents" integer NOT NULL DEFAULT 60,
  -- Total costs (in millicents for precision)
  ADD COLUMN "input_cost_millicents" integer NOT NULL DEFAULT 0,
  ADD COLUMN "output_cost_millicents" integer NOT NULL DEFAULT 0,
  ADD COLUMN "total_cost_millicents" integer NOT NULL DEFAULT 0; 