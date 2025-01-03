import { Metadata } from "next";
import { db } from "@/db";

export async function generateMetadata({
  params,
}: {
  params: { x_post_id: string };
}): Promise<Metadata> {
  const thread = await db.query.threads.findFirst({
    where: (threads, { eq }) => eq(threads.id, params.x_post_id),
    with: {
      tweets: {
        limit: 1,
        orderBy: (tweets, { asc }) => [asc(tweets.created_at)],
      },
    },
  });

  if (!thread) {
    return {
      title: "Thread not found | Elongatd",
      description: "The requested thread could not be found.",
    };
  }

  const description =
    thread.tweets[0]?.text?.slice(0, 200) +
    (thread.tweets[0]?.text?.length > 200 ? "..." : "");

  return {
    title: `${thread.author_name} on Elongatd`,
    description,
    openGraph: {
      title: `${thread.author_name} on Elongatd`,
      description,
      url: `https://elongatd.com/post/${params.x_post_id}`,
      siteName: "Elongatd",
      type: "article",
      authors: [thread.author_name],
      images: [
        {
          url: `https://elongatd.com/post/${params.x_post_id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Thread by ${thread.author_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${thread.author_name} on Elongatd`,
      description,
      creator: `@${thread.author_username}`,
      images: [`https://elongatd.com/post/${params.x_post_id}/opengraph-image`],
    },
  };
}
