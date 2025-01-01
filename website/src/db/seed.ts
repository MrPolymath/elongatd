import "dotenv/config";
import { db, schema } from "./";

async function seed() {
  try {
    // Sample thread data
    const threadId = "1873959124830236791";
    const timestamp = new Date("2023-12-31T12:00:00Z");

    // Insert main thread
    await db.insert(schema.threads).values({
      id: threadId,
      created_at: timestamp,
      author_id: "1234567890",
      author_name: "Rohan Paul",
      author_username: "rohanpaul_ai",
      author_profile_image_url:
        "https://pbs.twimg.com/profile_images/1234567890/avatar.jpg",
      author_verified: true,
      author_description: "AI & Product Engineer",
      author_followers_count: 10000,
      author_following_count: 1000,
      author_location: "San Francisco, CA",
      author_created_at: new Date("2020-01-01"),
      author_url: "https://twitter.com/rohanpaul_ai",
      total_replies: 5,
      total_retweets: 128,
      total_likes: 543,
    });

    // Insert thread tweets
    const tweets = [
      {
        id: `${threadId}_1`,
        thread_id: threadId,
        text: "1/ First and foremost, understand your users deeply. Not just their demographics, but their pains, desires, and daily routines. The best products solve real problems in elegant ways.",
        created_at: new Date("2023-12-31T12:01:00Z"),
        sequence: 1,
        metrics_replies: 10,
        metrics_retweets: 25,
        metrics_likes: 100,
        metrics_views: 1000,
        metrics_bookmarks: 5,
        attachments: [],
      },
      {
        id: `${threadId}_2`,
        thread_id: threadId,
        text: "2/ Simplicity is key. Often, we try to pack too many features. But the most successful products do one thing exceptionally well. Focus on your core value proposition.",
        created_at: new Date("2023-12-31T12:02:00Z"),
        sequence: 2,
        metrics_replies: 8,
        metrics_retweets: 20,
        metrics_likes: 90,
        metrics_views: 900,
        metrics_bookmarks: 4,
        attachments: [],
      },
      {
        id: `${threadId}_3`,
        thread_id: threadId,
        text: "3/ Think about the most successful apps on your phone. They probably excel at one primary function. This isn't by accident - it's deliberate design.",
        created_at: new Date("2023-12-31T12:03:00Z"),
        sequence: 3,
        metrics_replies: 12,
        metrics_retweets: 30,
        metrics_likes: 120,
        metrics_views: 1200,
        metrics_bookmarks: 6,
        attachments: [],
      },
      {
        id: `${threadId}_4`,
        thread_id: threadId,
        text: "4/ Iterate quickly, but thoughtfully. User feedback is gold, but you need to balance it with your vision. Not all feedback should be acted upon immediately.",
        created_at: new Date("2023-12-31T12:04:00Z"),
        sequence: 4,
        metrics_replies: 15,
        metrics_retweets: 35,
        metrics_likes: 150,
        metrics_views: 1500,
        metrics_bookmarks: 7,
        attachments: [],
      },
      {
        id: `${threadId}_5`,
        thread_id: threadId,
        text: "5/ Building great products is a journey, not a destination. Keep learning, stay curious, and always put your users first. Success will follow. If you found this thread helpful, make sure to follow for more insights!",
        created_at: new Date("2023-12-31T12:05:00Z"),
        sequence: 5,
        metrics_replies: 20,
        metrics_retweets: 40,
        metrics_likes: 200,
        metrics_views: 2000,
        metrics_bookmarks: 8,
        attachments: [],
      },
    ];

    await db.insert(schema.tweets).values(tweets);

    console.log("✅ Seed data inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
