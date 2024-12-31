import { pgTable, text, timestamp, integer, serial } from "drizzle-orm/pg-core";

export const threads = pgTable("threads", {
  id: text("id").primaryKey(), // This will be the X post ID
  username: text("username").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  text: text("text").notNull(),
  replies_count: integer("replies_count").notNull(),
  retweets_count: integer("retweets_count").notNull(),
  likes_count: integer("likes_count").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  thread_id: text("thread_id")
    .references(() => threads.id)
    .notNull(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  sequence: integer("sequence").notNull(), // To maintain reply order
  created_at: timestamp("created_at").defaultNow().notNull(),
});
