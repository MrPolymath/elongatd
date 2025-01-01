import { ImageResponse } from "next/og";
import { db } from "@/db/edge";

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
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 32,
              color: "rgb(156, 163, 175)",
            }}
          >
            Thread by @{thread.author_username}
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              width: "100%",
            }}
          >
            {thread.tweets[0]?.text || "No content"}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
