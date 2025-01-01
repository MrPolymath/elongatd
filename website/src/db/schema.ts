import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const threads = pgTable("threads", {
  id: text("id").primaryKey(), // This will be the X post ID
  created_at: timestamp("created_at").notNull(),
  added_at: timestamp("added_at").notNull().defaultNow(),

  // Author information
  author_id: text("author_id").notNull(),
  author_name: text("author_name").notNull(),
  author_username: text("author_username").notNull(),
  author_profile_image_url: text("author_profile_image_url").notNull(),
  author_verified: boolean("author_verified").notNull(),
  author_description: text("author_description").notNull(),
  author_followers_count: integer("author_followers_count").notNull(),
  author_following_count: integer("author_following_count").notNull(),
  author_location: text("author_location"),
  author_created_at: timestamp("author_created_at").notNull(),
  author_url: text("author_url"),

  // Total metrics for the thread
  total_replies: integer("replies_count").notNull(),
  total_retweets: integer("retweets_count").notNull(),
  total_likes: integer("likes_count").notNull(),

  // System fields
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const threadsRelations = relations(threads, ({ many, one }) => ({
  tweets: many(tweets),
  blogified: one(blogified_threads),
}));

export const tweets = pgTable("tweets", {
  id: text("id").primaryKey(), // X tweet ID
  thread_id: text("thread_id")
    .references(() => threads.id)
    .notNull(),
  text: text("text").notNull(),
  created_at: timestamp("created_at").notNull(),
  sequence: integer("sequence").notNull(), // To maintain tweet order in thread

  // Individual tweet metrics
  metrics_replies: integer("metrics_replies").notNull(),
  metrics_retweets: integer("metrics_retweets").notNull(),
  metrics_likes: integer("metrics_likes").notNull(),
  metrics_views: integer("metrics_views").notNull(),
  metrics_bookmarks: integer("metrics_bookmarks").notNull(),

  // Media attachments (stored as JSON)
  attachments: jsonb("attachments").default([]).notNull(),

  // System fields
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const tweetsRelations = relations(tweets, ({ one }) => ({
  thread: one(threads, {
    fields: [tweets.thread_id],
    references: [threads.id],
  }),
}));

export const blogified_threads = pgTable("blogified_threads", {
  thread_id: text("thread_id")
    .primaryKey()
    .references(() => threads.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  version: integer("version").notNull().default(1),
  is_paid: boolean("is_paid").notNull().default(false),
});

export const blogifiedThreadsRelations = relations(
  blogified_threads,
  ({ one }) => ({
    thread: one(threads, {
      fields: [blogified_threads.thread_id],
      references: [threads.id],
    }),
  })
);
