import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogified_threads } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { x_post_id: string } }
) {
  try {
    const postId = params.x_post_id;
    const blogPost = await db.query.blogified_threads.findFirst({
      where: eq(blogified_threads.thread_id, postId),
    });

    return NextResponse.json({ exists: !!blogPost });
  } catch (error) {
    console.error("Error checking blog existence:", error);
    return NextResponse.json(
      { error: "Failed to check blog existence" },
      { status: 500 }
    );
  }
}
