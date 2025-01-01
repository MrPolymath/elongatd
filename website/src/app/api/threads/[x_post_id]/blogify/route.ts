import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { createAzure } from "@ai-sdk/azure";
import { generateText } from "ai";

interface Attachment {
  type: string;
  url: string;
  thumbnail_url?: string;
  duration_ms?: number;
  width?: number;
  height?: number;
  bitrate?: number;
  title?: string;
  description?: string;
  original_url?: string;
}

interface Tweet {
  id: string;
  thread_id: string;
  text: string;
  created_at: Date;
  sequence: number;
  metrics_replies: number;
  metrics_retweets: number;
  metrics_likes: number;
  metrics_views: number;
  metrics_bookmarks: number;
  attachments: Attachment[];
}

// Initialize Azure OpenAI client
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert at converting Twitter/X threads into well-written, cohesive blog posts.
Your task is to take the content from a thread and rewrite it as a single, flowing article.
Maintain the original information and insights but improve the writing style to be more professional and blog-like.
Remove any Twitter-specific formatting or conventions.
Keep the tone informative and engaging.
Do not add any information that wasn't in the original thread.
Do not include any personal commentary or opinions not present in the original content.`;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ x_post_id: string }> }
) {
  const { x_post_id } = await context.params;

  // Check feature flag
  if (process.env.ENABLE_BLOGIFY !== "true") {
    return NextResponse.json(
      { error: "This feature is not currently available" },
      { status: 403 }
    );
  }

  try {
    // Check if we already have a blogified version
    const existingBlogified = await db
      .select()
      .from(schema.blogified_threads)
      .where(eq(schema.blogified_threads.thread_id, x_post_id))
      .limit(1);

    if (existingBlogified.length > 0) {
      return NextResponse.json({
        content: existingBlogified[0].content,
        created_at: existingBlogified[0].created_at,
      });
    }

    // Get the original thread content
    const thread = await db.query.threads.findFirst({
      where: eq(schema.threads.id, x_post_id),
      with: {
        tweets: true,
      },
    });

    if (!thread || !thread.tweets) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Sort tweets by sequence
    const sortedTweets = [...thread.tweets].sort(
      (a, b) => a.sequence - b.sequence
    );

    // Prepare the thread content for the AI
    const threadContent = sortedTweets.map((tweet) => tweet.text).join("\n\n");

    // Generate the blog post using Azure OpenAI
    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME!),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: threadContent },
      ],
    });

    // Store the blogified version
    await db.insert(schema.blogified_threads).values({
      thread_id: x_post_id,
      content: text,
      is_paid: false, // For now, all are free. This will change when we implement the paywall
    });

    return NextResponse.json({
      content: text,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error blogifying thread:", error);
    return NextResponse.json(
      { error: "Failed to blogify thread" },
      { status: 500 }
    );
  }
}
