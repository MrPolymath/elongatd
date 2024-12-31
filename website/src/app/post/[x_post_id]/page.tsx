"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Heart,
  Repeat2,
  Share,
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
        <div className="rounded-lg overflow-hidden bg-gray-800">
          <img
            src={attachment.url}
            alt="Thread image"
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      );
    case "video":
      return (
        <div className="rounded-lg overflow-hidden bg-black aspect-video">
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
          className="group block p-4 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-all hover:border-gray-700"
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

function XLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 fill-current"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
  );
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
              className="flex items-center gap-3 text-gray-400 hover:text-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              <XLogo />
              <span className="text-base">View original thread</span>
            </Link>

            {/* Interaction Metrics */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400 text-base"
                  onClick={() => window.open(originalUrl, "_blank")}
                >
                  <MessageCircle className="h-6 w-6 mr-2" />
                  <span>{formatNumber(total_metrics.replies)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-green-400 text-base"
                  onClick={() =>
                    window.open(
                      `https://x.com/intent/retweet?tweet_id=${postId}`,
                      "_blank"
                    )
                  }
                >
                  <Repeat2 className="h-6 w-6 mr-2" />
                  <span>{formatNumber(total_metrics.retweets)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-pink-400 text-base"
                  onClick={() =>
                    window.open(
                      `https://x.com/intent/like?tweet_id=${postId}`,
                      "_blank"
                    )
                  }
                >
                  <Heart className="h-6 w-6 mr-2" />
                  <span>{formatNumber(total_metrics.likes)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400"
                  onClick={() => window.open(originalUrl, "_blank")}
                >
                  <Share className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-invert prose-xl max-w-none">
          {/* Author Info */}
          <div className="flex flex-col gap-6 mb-12 not-prose bg-gray-800/20 rounded-xl p-6">
            <Link
              href={`https://x.com/${author.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-5 hover:opacity-90 transition-opacity"
            >
              <Avatar className="h-16 w-16 rounded-full ring-2 ring-blue-500/20">
                <AvatarImage src={author.profile_image_url} />
                <AvatarFallback>{author.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-bold text-2xl text-gray-100 truncate group-hover:text-blue-400 transition-colors">
                    {author.name}
                  </h2>
                  {author.verified && (
                    <svg viewBox="0 0 22 22" className="h-6 w-6 text-[#1d9bf0]">
                      <path
                        fill="currentColor"
                        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-400">@{author.username}</span>
                  {author.location && (
                    <>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-400">{author.location}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>

            <div className="space-y-4">
              {author.description && (
                <p className="text-gray-300 text-base leading-relaxed">
                  {(() => {
                    const urlRegex = /https?:\/\/[^\s]+/g;
                    const matches = [...author.description.matchAll(urlRegex)];

                    if (matches.length === 0) {
                      return author.description;
                    }

                    const fragments = [];
                    let lastIndex = 0;

                    matches.forEach((match) => {
                      const url = match[0];

                      // Add text before the URL
                      if (match.index! > lastIndex) {
                        fragments.push(
                          author.description.slice(lastIndex, match.index)
                        );
                      }

                      // Add the URL as a link
                      fragments.push(
                        <a
                          key={`bio-link-${match.index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {url}
                        </a>
                      );

                      lastIndex = match.index! + url.length;
                    });

                    // Add any remaining text
                    if (lastIndex < author.description.length) {
                      fragments.push(author.description.slice(lastIndex));
                    }

                    return fragments;
                  })()}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-100">
                    {formatNumber(author.followers_count)}
                  </span>
                  <span className="text-gray-400">Followers</span>
                </div>
                {author.following_count && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-100">
                        {formatNumber(author.following_count)}
                      </span>
                      <span className="text-gray-400">Following</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Joined</span>
                  <span className="text-gray-100">
                    {new Date(author.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
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
                  <div className="relative flow-root">
                    {part.attachments?.some(
                      (a) => a.type === "image" || a.type === "video"
                    ) && (
                      <div className="lg:float-right lg:ml-6 lg:w-[40%] mb-4">
                        {part.attachments?.map((attachment, i) => (
                          <Attachment key={i} attachment={attachment} />
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {part.text
                        .replace(
                          /&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-fA-F]{1,6});/gi,
                          (match) => {
                            const textarea = document.createElement("textarea");
                            textarea.innerHTML = match;
                            return textarea.value;
                          }
                        )
                        .trim()
                        .split("\n")
                        .map((line, i) => (
                          <span
                            key={i}
                            className={`block text-lg ${
                              !line.trim() ? "h-3" : "leading-normal"
                            }`}
                          >
                            {line.trim() || "\u00A0"}
                          </span>
                        ))}
                    </div>
                    {part.attachments?.some((a) => a.type === "link") && (
                      <div className="mt-4">
                        {part.attachments
                          ?.filter((a) => a.type === "link")
                          .map((attachment, i) => (
                            <Attachment key={i} attachment={attachment} />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Footer */}
        <div className="relative mt-24">
          <footer className="pt-6 border-t border-gray-800">
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
        </div>
      </main>
    </div>
  );
}
