import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { createAzure } from "@ai-sdk/azure";
import { generateText, Output } from "ai";
import { z } from "zod";

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
    ) as Tweet[];

    // Keep track of media attachments
    const mediaMap = new Map<number, Attachment>();
    let mediaCounter = 1;

    // Prepare the thread content for the AI, including attachment descriptions
    const threadContent = sortedTweets
      .map((tweet) => {
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
      const { experimental_output } = await generateText({
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

      // Create the complete blog post with media
      const completeBlogPost = {
        ...experimental_output,
        media: Object.fromEntries(mediaMap),
      };

      console.log("Complete blog post:", completeBlogPost);

      // Store the blogified version
      const blogContent = JSON.stringify(completeBlogPost);
      await db.insert(schema.blogified_threads).values({
        thread_id: x_post_id,
        content: blogContent,
        is_paid: false,
      });

      const response = {
        content: blogContent,
        created_at: new Date().toISOString(),
      };

      console.log("API Response:", response);

      return NextResponse.json(response);
    } catch (error) {
      console.error("Error blogifying thread:", error);
      return NextResponse.json(
        { error: "Failed to blogify thread" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error blogifying thread:", error);
    return NextResponse.json(
      { error: "Failed to blogify thread" },
      { status: 500 }
    );
  }
}
