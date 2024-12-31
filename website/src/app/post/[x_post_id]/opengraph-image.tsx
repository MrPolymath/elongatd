import { ImageResponse } from "next/og";
import { db } from "@/db";
import { tweets } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({
  params,
}: {
  params: { x_post_id: string };
}) {
  const thread = await db.query.threads.findFirst({
    where: (threads, { eq }) => eq(threads.id, params.x_post_id),
    with: {
      tweets: {
        limit: 1,
        orderBy: (t, { asc }) => [asc(t.created_at)],
      },
    },
  });

  if (!thread) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "rgb(17, 24, 39)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 48,
          }}
        >
          Thread not found
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "rgb(17, 24, 39)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 80,
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thread.author_profile_image_url}
            alt={thread.author_name}
            width={64}
            height={64}
            style={{
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 32,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {thread.author_name}
              {thread.author_verified && (
                <div
                  style={{
                    color: "rgb(96, 165, 250)",
                    fontSize: 24,
                  }}
                >
                  ✓
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "rgb(156, 163, 175)",
              }}
            >
              @{thread.author_username}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 40,
            color: "white",
            lineHeight: 1.4,
          }}
        >
          {thread.tweets?.[0]?.text?.slice(0, 140)}
          {thread.tweets?.[0]?.text?.length > 140 ? "..." : ""}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgb(156, 163, 175)",
          }}
        >
          Read more on Elongatd
        </div>
      </div>
    ),
    { ...size }
  );
}
