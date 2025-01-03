import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { createAzure } from "@ai-sdk/azure";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

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
  metrics: {
    replies: number;
    retweets: number;
    likes: number;
    views: number;
    bookmarks: number;
  };
}

// Initialize Azure OpenAI client
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert at converting Twitter/X threads into well-written, cohesive blog posts.
Your task is to take the content from a thread and rewrite it as a single, flowing article.
The thread content will include descriptions of media attachments (images, videos, links) in square brackets with IDs like [Image:1], [Video:2], etc.

Write your response in Markdown format, and when referencing media:
1. Keep track of where each media element should appear in the text
2. Reference them using the same IDs from the input
3. Use natural language to introduce them, like:
   - "As shown in the image below..."
   - "The following video demonstrates..."
   - "According to the linked article..."

Example input:
Here's my first point
[Image:1: A diagram showing the process]
Here's my second point
[Link:2: Understanding Basics - Detailed guide]

Example output:
{
  "content": "Here's my first point. As shown in the image below, the process follows a clear sequence of steps.\n\n{media:1}\n\nHere's my second point. According to the linked article about Understanding Basics, this concept has several important implications.\n\n{media:2}",
  "title": "A Clear Guide to Understanding the Process",
  "summary": "A detailed exploration of the process, featuring visual aids and expert insights."
}

Format your response as a JSON object with these fields:
- content: The main blog post content in Markdown format, with {media:N} placeholders
- title: A concise, descriptive title for the blog post
- summary: A one-sentence summary of the post

Maintain the original information and insights but improve the writing style to be more professional and blog-like.
Remove any Twitter-specific formatting or conventions.
Keep the tone informative and engaging.
Do not add any information that wasn't in the original thread.
Do not include any personal commentary or opinions not present in the original content.`;

const blogSchema = z.object({
  content: z
    .string()
    .describe(
      "The main blog post content in Markdown format, with {media:N} placeholders"
    ),
  title: z.string().describe("A concise, descriptive title for the blog post"),
  summary: z.string().describe("A one-sentence summary of the post"),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ x_post_id: string }> }
) {
  try {
    const { x_post_id } = await context.params;
    const threadData = await request.json();

    // Get user info - use mock data in development
    let userId: string;
    let userName: string;
    let userImage: string;

    if (process.env.NODE_ENV === "development") {
      // Use mock user data for local development
      userId = "dev_user";
      userName = "Development User";
      userImage = "https://avatars.githubusercontent.com/u/1234567";
    } else {
      // Get the user session in production
      const session = await getServerSession(authOptions);

      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Extract user info from session
      userId = session.user.id;
      userName = session.user.name || "Anonymous";
      userImage = session.user.image || "";

      if (!userId) {
        return NextResponse.json(
          { error: "Invalid user session" },
          { status: 400 }
        );
      }
    }

    // Check feature flag
    if (process.env.ENABLE_BLOGIFY !== "true") {
      return NextResponse.json(
        { error: "This feature is not currently available" },
        { status: 403 }
      );
    }

    // First store the thread data
    await db.insert(schema.threads).values({
      id: x_post_id,
      created_at: new Date(threadData.created_at),
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
      total_replies: threadData.total_metrics.replies,
      total_retweets: threadData.total_metrics.retweets,
      total_likes: threadData.total_metrics.likes,
    });

    // Then store each tweet
    await Promise.all(
      threadData.tweets.map((tweet: Tweet, index: number) =>
        db.insert(schema.tweets).values({
          id: tweet.id,
          thread_id: x_post_id,
          text: tweet.text,
          created_at: new Date(tweet.created_at),
          sequence: index,
          metrics_replies: tweet.metrics.replies,
          metrics_retweets: tweet.metrics.retweets,
          metrics_likes: tweet.metrics.likes,
          metrics_views: tweet.metrics.views,
          metrics_bookmarks: tweet.metrics.bookmarks,
          attachments: tweet.attachments,
        })
      )
    );

    // Now generate the blog version
    const sortedTweets = threadData.tweets;
    const mediaMap = new Map<number, Attachment>();
    let mediaCounter = 1;

    // Prepare the thread content for the AI, including attachment descriptions
    const threadContent = sortedTweets
      .map((tweet: Tweet) => {
        let content = tweet.text;

        // Add attachment descriptions
        if (tweet.attachments && tweet.attachments.length > 0) {
          const attachmentDescriptions = tweet.attachments.map(
            (attachment: Attachment) => {
              const mediaId = mediaCounter++;
              mediaMap.set(mediaId, attachment);

              switch (attachment.type) {
                case "image":
                  return `[Image:${mediaId}: ${
                    attachment.description || "Visual content"
                  }]`;
                case "video":
                  return `[Video:${mediaId}: ${
                    attachment.description || "Video content"
                  }${
                    attachment.duration_ms
                      ? ` (${Math.round(attachment.duration_ms / 1000)}s)`
                      : ""
                  }]`;
                case "link":
                  return `[Link:${mediaId}: ${
                    attachment.title || attachment.url
                  }${
                    attachment.description ? ` - ${attachment.description}` : ""
                  }]`;
                default:
                  return null;
              }
            }
          );

          const validDescriptions = attachmentDescriptions.filter(
            (desc: string | null): desc is string => desc !== null
          );

          if (validDescriptions.length > 0) {
            content += "\n" + validDescriptions.join("\n");
          }
        }

        return content;
      })
      .join("\n\n");

    try {
      console.log("Generating blog post with AI...");
      const { experimental_output, usage } = await generateText({
        model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME!),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: threadContent },
        ],
        experimental_output: Output.object({
          schema: blogSchema,
        }),
      });

      console.log("AI Response:", experimental_output);
      console.log("Token usage:", usage);

      // Calculate costs as before...
      const inputCostPer1mTokensCents = 15;
      const outputCostPer1mTokensCents = 60;
      const inputCostMillicents = Math.round(
        (usage.promptTokens / 1_000_000) * inputCostPer1mTokensCents * 1000
      );
      const outputCostMillicents = Math.round(
        (usage.completionTokens / 1_000_000) * outputCostPer1mTokensCents * 1000
      );
      const totalCostMillicents = inputCostMillicents + outputCostMillicents;

      // Create the complete blog post with media
      const completeBlogPost = {
        ...experimental_output,
        media: Object.fromEntries(mediaMap),
      };

      // Store the blogified version
      const blogContent = JSON.stringify(completeBlogPost);
      await db.insert(schema.blogified_threads).values({
        thread_id: x_post_id,
        user_id: userId,
        user_name: userName,
        user_image: userImage,
        content: blogContent,
        is_paid: false,
        input_tokens: usage.promptTokens,
        output_tokens: usage.completionTokens,
        total_tokens: usage.totalTokens,
        input_cost_per_1m_tokens_cents: inputCostPer1mTokensCents,
        output_cost_per_1m_tokens_cents: outputCostPer1mTokensCents,
        input_cost_millicents: inputCostMillicents,
        output_cost_millicents: outputCostMillicents,
        total_cost_millicents: totalCostMillicents,
      });

      return NextResponse.json({
        content: blogContent,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating blog post:", error);
      return NextResponse.json(
        { error: "Failed to generate blog post" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
