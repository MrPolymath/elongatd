import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogified_threads } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set(
    "Access-Control-Allow-Origin",
    "chrome-extension://jdfplepcnhehmmnfnmmejbdilmeljcon"
  );
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ x_post_id: string }> }
) {
  try {
    const { x_post_id } = await context.params;
    const blogPost = await db.query.blogified_threads.findFirst({
      where: eq(blogified_threads.thread_id, x_post_id),
    });

    return corsResponse(
      NextResponse.json({
        exists: !!blogPost,
        content: blogPost ? blogPost.content : null,
      })
    );
  } catch (error) {
    console.error("Error checking if blog post exists:", error);
    return corsResponse(
      NextResponse.json({ error: "Failed to check blog post" }, { status: 500 })
    );
  }
}
