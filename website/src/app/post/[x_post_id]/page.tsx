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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl">Loading thread...</div>
      </div>
    );
  }

  if (error || !threadData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
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
                >
                  <MessageCircle className="h-5 w-5 mr-1" />
                  <span>{formatNumber(total_metrics.replies)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-green-400"
                >
                  <Repeat2 className="h-5 w-5 mr-1" />
                  <span>{formatNumber(total_metrics.retweets)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-pink-400"
                >
                  <Heart className="h-5 w-5 mr-1" />
                  <span>{formatNumber(total_metrics.likes)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400"
                >
                  <Share className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-invert prose-lg max-w-none">
          {/* Author Info */}
          <div className="flex items-start gap-4 mb-8 not-prose">
            <Avatar className="h-12 w-12">
              <AvatarImage src={author.profile_image_url} />
              <AvatarFallback>{author.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-xl text-gray-100">
                  {author.name}
                </h2>
                <span className="text-gray-400">@{author.username}</span>
                {author.verified && (
                  <span className="text-blue-400 text-sm">✓ Verified</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{author.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span>{formatNumber(author.followers_count)} followers</span>
                <span>{author.location}</span>
                <time>
                  Joined {new Date(author.created_at).toLocaleDateString()}
                </time>
              </div>
            </div>
          </div>

          {/* Thread Content */}
          <div className="space-y-6">
            {content.map((part, index) => {
              // Get URLs from link attachments
              const linkUrls =
                part.attachments
                  ?.filter((a) => a.type === "link")
                  .map((a) => a.url) || [];

              // Process text to replace URLs with clickable links
              let displayText = part.text;
              const urlRegex = /https?:\/\/[^\s]+/g;
              const matches = [...displayText.matchAll(urlRegex)];

              if (matches.length > 0) {
                // Create fragments with replaced URLs
                const fragments = [];
                let lastIndex = 0;

                matches.forEach((match, i) => {
                  const url = match[0];
                  // Skip if this URL has a preview card
                  if (linkUrls.includes(url)) {
                    displayText = displayText.replace(url, "");
                    return;
                  }

                  // Add text before the URL
                  if (match.index > lastIndex) {
                    fragments.push(displayText.slice(lastIndex, match.index));
                  }

                  // Add the URL as a link
                  fragments.push(
                    <a
                      key={`link-${index}-${i}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      link
                    </a>
                  );

                  lastIndex = match.index + url.length;
                });

                // Add any remaining text
                if (lastIndex < displayText.length) {
                  fragments.push(displayText.slice(lastIndex));
                }

                return (
                  <div key={index} className="prose prose-invert prose-lg">
                    <p className="whitespace-pre-wrap">{fragments}</p>
                    {part.attachments?.map((attachment, i) => (
                      <Attachment key={i} attachment={attachment} />
                    ))}
                  </div>
                );
              }

              // If no URLs, render normally
              return (
                <div key={index} className="prose prose-invert prose-lg">
                  <p className="whitespace-pre-wrap">{displayText.trim()}</p>
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
          <div className="flex items-center justify-between text-sm text-gray-400">
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
