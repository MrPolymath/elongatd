import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogified_threads } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ x_post_id: string }> }
) {
  try {
    const { x_post_id } = await context.params;
    const blogPost = await db.query.blogified_threads.findFirst({
      where: eq(blogified_threads.thread_id, x_post_id),
    });

    return NextResponse.json({
      exists: !!blogPost,
      content: blogPost ? blogPost.content : null,
    });
  } catch (error) {
    console.error("Error checking if blog post exists:", error);
    return NextResponse.json(
      { error: "Failed to check blog post" },
      { status: 500 }
    );
  }
}
