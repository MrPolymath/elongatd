import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

interface TweetMetrics {
  replies: number;
  retweets: number;
  likes: number;
  views: number;
  bookmarks: number;
}

interface Author {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  verified: boolean;
  description: string;
  followers_count: number;
  following_count: number;
  location: string;
  created_at: string;
  url: string;
}

interface TweetAttachment {
  type: string;
  url: string;
  video_info?: {
    duration_millis: number;
    variants: {
      bitrate: number;
      content_type: string;
      url: string;
    }[];
  };
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  metrics: TweetMetrics;
  attachments: TweetAttachment[];
}

interface ThreadData {
  author: Author;
  thread_id: string;
  created_at: string;
  tweets: Tweet[];
  total_metrics: TweetMetrics;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ x_post_id: string }> }
) {
  const { x_post_id } = await context.params;

  try {
    const thread = await db.query.threads.findFirst({
      where: eq(schema.threads.id, x_post_id),
    });

    if (!thread) {
      return corsResponse(
        NextResponse.json({ error: "Thread not found" }, { status: 404 })
      );
    }

    const threadTweets = await db.query.tweets.findMany({
      where: eq(schema.tweets.thread_id, x_post_id),
      orderBy: [desc(schema.tweets.sequence)],
    });

    // Format the response to match our ThreadData interface
    const threadData: ThreadData = {
      author: {
        id: thread.author_id,
        name: thread.author_name,
        username: thread.author_username,
        profile_image_url: thread.author_profile_image_url,
        verified: thread.author_verified,
        description: thread.author_description,
        followers_count: thread.author_followers_count,
        following_count: thread.author_following_count,
        location: thread.author_location || "",
        created_at: thread.author_created_at.toISOString(),
        url: thread.author_url || "",
      },
      thread_id: x_post_id,
      created_at: thread.created_at.toISOString(),
      tweets: threadTweets.map((tweet) => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at.toISOString(),
        metrics: {
          replies: tweet.metrics_replies,
          retweets: tweet.metrics_retweets,
          likes: tweet.metrics_likes,
          views: tweet.metrics_views,
          bookmarks: tweet.metrics_bookmarks,
        },
        attachments: tweet.attachments as TweetAttachment[],
      })),
      total_metrics: {
        replies: thread.total_replies,
        retweets: thread.total_retweets,
        likes: thread.total_likes,
        views: 0,
        bookmarks: 0,
      },
    };

    return corsResponse(NextResponse.json(threadData));
  } catch (error) {
    console.error("Error fetching thread:", error);
    return corsResponse(
      NextResponse.json(
        { error: "Failed to fetch thread data" },
        { status: 500 }
      )
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ x_post_id: string }> }
) {
  const { x_post_id } = await context.params;

  try {
    const threadData = (await request.json()) as ThreadData;

    // Log the received data for debugging
    console.log("📥 Received thread data:", {
      postId: x_post_id,
      url: request.url,
      timestamp: new Date().toISOString(),
      data: threadData,
    });

    // Basic validation
    if (
      !threadData.author ||
      !Array.isArray(threadData.tweets) ||
      threadData.tweets.length === 0
    ) {
      return corsResponse(
        NextResponse.json(
          { error: "Invalid thread data format" },
          { status: 400 }
        )
      );
    }

    // Store the thread data in the database
    await db.transaction(async (tx) => {
      const existingThread = await tx.query.threads.findFirst({
        where: (threads, { eq }) => eq(threads.id, threadData.thread_id),
      });

      if (existingThread) {
        // Update existing thread
        await tx
          .update(schema.threads)
          .set({
            author_name: threadData.author.name,
            author_username: threadData.author.username,
            author_profile_image_url: threadData.author.profile_image_url,
            author_verified: threadData.author.verified,
            author_description: threadData.author.description,
            author_followers_count: threadData.author.followers_count,
            author_following_count: threadData.author.following_count,
            author_location: threadData.author.location || null,
            author_url: threadData.author.url || null,
            total_replies: threadData.total_metrics.replies,
            total_retweets: threadData.total_metrics.retweets,
            total_likes: threadData.total_metrics.likes,
          })
          .where(eq(schema.threads.id, threadData.thread_id));

        // Delete existing tweets
        await tx
          .delete(schema.tweets)
          .where(eq(schema.tweets.thread_id, threadData.thread_id));
      } else {
        // Create new thread
        await tx.insert(schema.threads).values({
          id: threadData.thread_id,
          author_id: threadData.author.id,
          author_name: threadData.author.name,
          author_username: threadData.author.username,
          author_profile_image_url: threadData.author.profile_image_url,
          author_verified: threadData.author.verified,
          author_description: threadData.author.description,
          author_followers_count: threadData.author.followers_count,
          author_following_count: threadData.author.following_count,
          author_location: threadData.author.location || null,
          author_created_at: new Date(threadData.author.created_at),
          author_url: threadData.author.url || null,
          created_at: new Date(threadData.created_at),
          total_replies: threadData.total_metrics.replies,
          total_retweets: threadData.total_metrics.retweets,
          total_likes: threadData.total_metrics.likes,
        });
      }

      // Insert new tweets
      await tx.insert(schema.tweets).values(
        threadData.tweets.map((tweet, index) => ({
          id: tweet.id,
          thread_id: threadData.thread_id,
          text: tweet.text,
          created_at: new Date(tweet.created_at),
          sequence: index,
          metrics_replies: tweet.metrics.replies,
          metrics_retweets: tweet.metrics.retweets,
          metrics_likes: tweet.metrics.likes,
          metrics_views: tweet.metrics.views,
          metrics_bookmarks: tweet.metrics.bookmarks,
          attachments: tweet.attachments,
        }))
      );
    });

    return corsResponse(
      NextResponse.json({
        success: true,
        id: x_post_id,
        message: "Thread data stored successfully",
      })
    );
  } catch (error) {
    console.error("Error processing thread:", error);
    return corsResponse(
      NextResponse.json(
        {
          error: "Failed to process thread data",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      )
    );
  }
}
