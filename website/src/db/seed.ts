import "dotenv/config";
import { db, schema } from "./";

async function seed() {
  try {
    // Sample thread data
    const threadId = "1873959124830236791";
    const username = "rohanpaul_ai";
    const timestamp = new Date("2023-12-31T12:00:00Z");

    // Insert main thread
    await db.insert(schema.threads).values({
      id: threadId,
      username,
      timestamp,
      text: "🧵 Let's talk about building successful products. After years of experience, here are my key insights on what makes products truly resonate with users.",
      replies_count: 5,
      retweets_count: 128,
      likes_count: 543,
    });

    // Insert thread replies
    const replies = [
      {
        thread_id: threadId,
        text: "1/ First and foremost, understand your users deeply. Not just their demographics, but their pains, desires, and daily routines. The best products solve real problems in elegant ways.",
        timestamp: new Date("2023-12-31T12:01:00Z"),
        sequence: 1,
      },
      {
        thread_id: threadId,
        text: "2/ Simplicity is key. Often, we try to pack too many features. But the most successful products do one thing exceptionally well. Focus on your core value proposition.",
        timestamp: new Date("2023-12-31T12:02:00Z"),
        sequence: 2,
      },
      {
        thread_id: threadId,
        text: "3/ Think about the most successful apps on your phone. They probably excel at one primary function. This isn't by accident - it's deliberate design.",
        timestamp: new Date("2023-12-31T12:03:00Z"),
        sequence: 3,
      },
      {
        thread_id: threadId,
        text: "4/ Iterate quickly, but thoughtfully. User feedback is gold, but you need to balance it with your vision. Not all feedback should be acted upon immediately.",
        timestamp: new Date("2023-12-31T12:04:00Z"),
        sequence: 4,
      },
      {
        thread_id: threadId,
        text: "5/ Building great products is a journey, not a destination. Keep learning, stay curious, and always put your users first. Success will follow. If you found this thread helpful, make sure to follow for more insights!",
        timestamp: new Date("2023-12-31T12:05:00Z"),
        sequence: 5,
      },
    ];

    await db.insert(schema.replies).values(replies);

    console.log("✅ Seed data inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
