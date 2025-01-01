import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
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
  const { x_post_id } = await context.params;

  try {
    // Check if thread exists in our database
    const thread = await db.query.threads.findFirst({
      where: eq(schema.threads.id, x_post_id),
    });

    return NextResponse.json({ exists: !!thread });
  } catch (error) {
    console.error("Error checking thread existence:", error);
    return NextResponse.json(
      { error: "Failed to check thread existence" },
      { status: 500 }
    );
  }
}
