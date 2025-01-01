import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const latestThreads = await db.query.threads.findMany({
      limit: 10,
      orderBy: (threads, { desc }) => [desc(threads.added_at)],
      with: {
        tweets: {
          limit: 1,
          orderBy: (t, { asc }) => [asc(t.sequence)],
        },
      },
    });

    return NextResponse.json(latestThreads);
  } catch (error) {
    console.error("Error fetching latest threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest threads" },
      { status: 500 }
    );
  }
}
