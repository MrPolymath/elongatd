"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Heart,
  Repeat2,
  Share,
  Twitter,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Types for our thread data
interface Metrics {
  replies: number;
  retweets: number;
  likes: number;
  views: number;
  bookmarks: number;
}

interface Author {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  verified: boolean;
  description: string;
  followers_count: number;
  following_count: number;
  location: string;
  created_at: string;
  url: string;
}

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
  text: string;
  created_at: string;
  metrics: Metrics;
  attachments: Attachment[];
}

interface ThreadData {
  author: Author;
  thread_id: string;
  created_at: string;
  tweets: Tweet[];
  total_metrics: Metrics;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function Attachment({ attachment }: { attachment: Attachment }) {
  switch (attachment.type) {
    case "image":
      return (
        <div className="my-6 rounded-lg overflow-hidden max-h-[600px] flex items-center justify-center bg-gray-800">
          <img
            src={attachment.url}
            alt="Thread image"
            className="max-w-full max-h-[600px] object-contain"
            loading="lazy"
          />
        </div>
      );
    case "video":
      return (
        <div className="my-6 rounded-lg overflow-hidden bg-black aspect-video max-h-[600px]">
          <video
            src={attachment.url}
            poster={attachment.thumbnail_url}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <source src={attachment.url} type="video/mp4" />
          </video>
        </div>
      );
    case "link":
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block my-6 p-4 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-all hover:border-gray-700"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 text-blue-400 group-hover:text-gray-100 transition-colors truncate">
                {attachment.title}
              </h3>
              <p className="text-gray-400 line-clamp-2">
                {attachment.description}
              </p>
            </div>
            <ExternalLink className="h-5 w-5 text-blue-400 group-hover:text-gray-100 transition-colors flex-shrink-0" />
          </div>
        </a>
      );
    default:
      return null;
  }
}

export default function ThreadPost() {
  const params = useParams();
  const postId = params.x_post_id as string;
  const [threadData, setThreadData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreadData = async () => {
      try {
        const response = await fetch(`/api/threads/${postId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch thread data");
        }
        const data = await response.json();
        setThreadData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchThreadData();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading thread...</div>
      </div>
    );
  }

  if (error || !threadData) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-400">
          {error || "Thread not found"}
        </div>
      </div>
    );
  }

  const { author, tweets, total_metrics } = threadData;
  const originalUrl = `https://x.com/${author.username}/status/${postId}`;

  // Combine all tweet text and attachments in chronological order (oldest first)
  const content = [...tweets]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((tweet) => ({
      text: tweet.text,
      attachments: tweet.attachments,
    }));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Sticky Header with Metrics */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* X Origin Link */}
            <Link
              href={originalUrl}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="h-5 w-5" />
              <span className="text-sm">View original thread</span>
            </Link>

            {/* Interaction Metrics */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400"
                  onClick={() => window.open(originalUrl, "_blank")}
                >
                  <MessageCircle className="h-5 w-5 mr-1" />
                  <span>{formatNumber(total_metrics.replies)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-green-400"
                  onClick={() =>
                    window.open(
                      `https://x.com/intent/retweet?tweet_id=${postId}`,
                      "_blank"
                    )
                  }
                >
                  <Repeat2 className="h-5 w-5 mr-1" />
                  <span>{formatNumber(total_metrics.retweets)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-pink-400"
                  onClick={() =>
                    window.open(
                      `https://x.com/intent/like?tweet_id=${postId}`,
                      "_blank"
                    )
                  }
                >
                  <Heart className="h-5 w-5 mr-1" />
                  <span>{formatNumber(total_metrics.likes)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400"
                  onClick={() => window.open(originalUrl, "_blank")}
                >
                  <Share className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-invert prose-xl max-w-none">
          {/* Author Info */}
          <div className="flex items-start gap-4 mb-8 not-prose">
            <Avatar className="h-14 w-14">
              <AvatarImage src={author.profile_image_url} />
              <AvatarFallback>{author.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-2xl text-gray-100">
                  {author.name}
                </h2>
                <span className="text-gray-400 text-lg">
                  @{author.username}
                </span>
                {author.verified && (
                  <span className="text-blue-400 text-base">✓ Verified</span>
                )}
              </div>
              <p className="text-gray-400 text-base mt-1">
                {author.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-base text-gray-400">
                <span>{formatNumber(author.followers_count)} followers</span>
                <span>{author.location}</span>
                <time>
                  Joined {new Date(author.created_at).toLocaleDateString()}
                </time>
              </div>
            </div>
          </div>

          {/* Thread Content */}
          <div className="space-y-8">
            {content.map((part, index) => {
              // Get URLs from link attachments
              const linkUrls =
                part.attachments
                  ?.filter((a) => a.type === "link")
                  .map((a) => a.url) || [];

              // Remove t.co URLs that aren't link attachments
              const tcoRegex = /https:\/\/t\.co\/\w+/g;
              const tcoMatches = [...part.text.matchAll(tcoRegex)];
              tcoMatches.forEach((match) => {
                if (!linkUrls.includes(match[0])) {
                  part.text = part.text.replace(match[0], "").trim();
                }
              });

              // First handle URLs
              const urlRegex = /https?:\/\/[^\s]+/g;
              const urlMatches = [...part.text.matchAll(urlRegex)]
                // Only keep URLs that are either:
                // 1. Not t.co links
                // 2. t.co links that correspond to actual link attachments
                .filter((match) => {
                  const url = match[0];
                  if (!url.startsWith("https://t.co/")) return true;
                  return linkUrls.includes(url);
                });

              // Then handle @mentions, ensuring they're not part of an email
              const mentionRegex = /(?:^|\s)@(\w+)(?=[\s.,!?]|$)/g;
              const mentionMatches = [...part.text.matchAll(mentionRegex)];

              if (urlMatches.length > 0 || mentionMatches.length > 0) {
                // Create fragments with replaced URLs and mentions
                const fragments = [];
                let lastIndex = 0;

                // Sort matches by index to process them in order
                const allMatches = [
                  ...urlMatches.map((m) => ({ type: "url", match: m })),
                  ...mentionMatches.map((m) => ({ type: "mention", match: m })),
                ].sort((a, b) => a.match.index! - b.match.index!);

                allMatches.forEach((item) => {
                  const match = item.match;
                  const matchText = match[0];

                  if (item.type === "url") {
                    // Skip if this URL has a preview card
                    if (linkUrls.includes(matchText)) {
                      part.text = part.text.replace(matchText, "");
                      return;
                    }
                  }

                  // Add text before the match
                  if (match.index! > lastIndex) {
                    fragments.push(part.text.slice(lastIndex, match.index));
                  }

                  // Add the match as a link
                  if (item.type === "url") {
                    fragments.push(
                      <a
                        key={`link-${index}-${match.index}`}
                        href={matchText}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-lg"
                      >
                        {matchText}
                      </a>
                    );
                  } else {
                    // Handle @mention
                    const username = match[1]; // Get the username without @
                    // If there's a space before the @, add it to the fragments
                    if (match[0].startsWith(" ")) {
                      fragments.push(" ");
                    }
                    fragments.push(
                      <a
                        key={`mention-${index}-${match.index}`}
                        href={`https://x.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-lg"
                      >
                        @{username}
                      </a>
                    );
                  }

                  lastIndex = match.index! + matchText.length;
                });

                // Add any remaining text
                if (lastIndex < part.text.length) {
                  fragments.push(part.text.slice(lastIndex));
                }

                return (
                  <div key={index} className="prose prose-invert prose-xl">
                    <p className="whitespace-pre-wrap text-lg leading-relaxed">
                      {fragments}
                    </p>
                    {part.attachments?.map((attachment, i) => (
                      <Attachment key={i} attachment={attachment} />
                    ))}
                  </div>
                );
              }

              // If no URLs or mentions, render normally
              return (
                <div key={index} className="prose prose-invert prose-xl">
                  <p className="whitespace-pre-wrap text-lg leading-relaxed">
                    {part.text
                      .trim()
                      .split("\n")
                      .map((line, i) => (
                        <span
                          key={i}
                          className={`block ${
                            !line.trim() ? "leading-[1em]" : "leading-relaxed"
                          }`}
                        >
                          {line || "\u00A0"}
                        </span>
                      ))}
                  </p>
                  {part.attachments?.map((attachment, i) => (
                    <Attachment key={i} attachment={attachment} />
                  ))}
                </div>
              );
            })}
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between text-base text-gray-400">
            <time>
              Originally posted on{" "}
              {new Date(threadData.created_at).toLocaleDateString()}
            </time>
            <Link
              href={originalUrl}
              className="text-blue-400 hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on X
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
