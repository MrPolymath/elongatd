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
}

interface Tweet {
  username: string;
  timestamp: string;
  text: string;
  metrics: TweetMetrics;
}

interface ThreadData {
  mainTweet: Tweet;
  replies: Tweet[];
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

    const replies = await db.query.replies.findMany({
      where: eq(schema.replies.thread_id, x_post_id),
      orderBy: [desc(schema.replies.sequence)],
    });

    // Format the response to match our ThreadData interface
    const threadData: ThreadData = {
      mainTweet: {
        username: thread.username,
        timestamp: thread.timestamp.toISOString(),
        text: thread.text,
        metrics: {
          replies: thread.replies_count,
          retweets: thread.retweets_count,
          likes: thread.likes_count,
        },
      },
      replies: replies.map((reply) => ({
        username: thread.username,
        timestamp: reply.timestamp.toISOString(),
        text: reply.text,
        metrics: {
          replies: 0,
          retweets: 0,
          likes: 0,
        },
      })),
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
    if (!threadData.mainTweet || !Array.isArray(threadData.replies)) {
      return corsResponse(
        NextResponse.json(
          { error: "Invalid thread data format" },
          { status: 400 }
        )
      );
    }

    // For now, just return success without storing in DB
    return corsResponse(
      NextResponse.json({
        success: true,
        id: x_post_id,
        message: "Thread data received successfully (currently in debug mode)",
      })
    );

    /* Commented out DB storage for now
    await db.transaction(async (tx) => {
      await tx.insert(schema.threads).values({
        id: x_post_id,
        username: threadData.mainTweet.username,
        timestamp: new Date(threadData.mainTweet.timestamp),
        text: threadData.mainTweet.text,
        replies_count: threadData.mainTweet.metrics.replies,
        retweets_count: threadData.mainTweet.metrics.retweets,
        likes_count: threadData.mainTweet.metrics.likes,
      });

      if (threadData.replies.length > 0) {
        await tx.insert(schema.replies).values(
          threadData.replies.map((reply: Tweet, index: number) => ({
            thread_id: x_post_id,
            text: reply.text,
            timestamp: new Date(reply.timestamp),
            sequence: index + 1,
          }))
        );
      }
    });
    */
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
