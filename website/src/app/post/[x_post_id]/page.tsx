"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Chrome, Share, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MarkdownWithMedia } from "@/components/markdown-with-media";
import { ImageCarousel } from "@/components/image-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

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

interface BlogContent {
  title: string;
  content: string;
  summary: string;
  media: Record<string, Attachment>;
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

function Attachment({ attachments }: { attachments: Attachment[] }) {
  // Group attachments by type
  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
  const links = attachments.filter((a) => a.type === "link");

  return (
    <div className="space-y-4">
      {/* Render images */}
      {images.length > 0 && (
        <div className="rounded-lg border-2 border-border/40 overflow-hidden">
          {images.length === 1 ? (
            <Image
              src={images[0].url}
              alt=""
              className="w-full h-auto"
              width={images[0].width || 1200}
              height={images[0].height || 675}
              priority={true}
            />
          ) : (
            <ImageCarousel
              images={images.map((img) => ({
                url: img.url,
                width: img.width,
                height: img.height,
              }))}
            />
          )}
        </div>
      )}

      {/* Render videos */}
      {videos.map((video, index) => (
        <div
          key={index}
          className="rounded-lg overflow-hidden bg-black aspect-video border-2 border-zinc-600 border-border/40"
        >
          <video
            src={video.url}
            poster={video.thumbnail_url}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <source src={video.url} type="video/mp4" />
          </video>
        </div>
      ))}

      {/* Render links */}
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-4 border-2 border-zinc-600 border-border/40 rounded-lg hover:bg-muted/50 transition-all hover:border-border"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 text-blue-400 group-hover:text-foreground transition-colors truncate">
                {link.title}
              </h3>
              <p className="text-muted-foreground line-clamp-2">
                {link.description}
              </p>
            </div>
            <ExternalLink className="h-5 w-5 text-blue-400 group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
        </a>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <div className="h-5 w-5 text-foreground bg-blue-500/10 rounded-full p-1">
      <svg viewBox="0 0 22 22" aria-label="Verified account">
        <path
          fill="currentColor"
          d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
        />
      </svg>
    </div>
  );
}

export default function ThreadPost() {
  const params = useParams();
  const postId = params.x_post_id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threadData, setThreadData] = useState<ThreadData | null>(null);
  const [blogifiedContent, setBlogifiedContent] = useState<BlogContent | null>(
    null
  );
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const setBlogContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      setBlogifiedContent(parsed);
    } catch (err) {
      console.error("Error parsing blog content:", err);
      setError("Failed to parse blog content");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/threads/${postId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch thread data");
        }
        const data = await response.json();
        setThreadData(data);

        // Check if blog version exists
        const blogExistsResponse = await fetch(
          `/api/threads/${postId}/blogify/exists`
        );
        if (blogExistsResponse.ok) {
          const { exists, content } = await blogExistsResponse.json();
          if (exists && content) {
            setBlogContent(content);
          } else {
            throw new Error(
              "Blog version not found. Please create it from the X post first."
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000); // Hide after 2 seconds
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl">Loading blog post...</div>
      </div>
    );
  }

  if (error || !threadData || !blogifiedContent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl text-red-400">
          {error || "Blog post not found"}
        </div>
      </div>
    );
  }

  const { author } = threadData;
  const originalUrl = `https://x.com/${author.username}/status/${postId}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header with Metrics */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Explore Link and Theme Toggle */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-lg font-semibold hover:bg-muted/50"
              >
                <Link href="/">Explore</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex text-base rounded-full gap-2 border border-border/80 hover:bg-muted/50"
                onClick={() =>
                  window.open(
                    "https://chrome.google.com/webstore/detail/your-extension-id",
                    "_blank"
                  )
                }
              >
                <Chrome className="h-4 w-4" />
                <span className="hidden md:inline">Install Extension</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-auto p-2 rounded-full"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Right side: Share Button */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-base"
              >
                <Link
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  View original
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-blue-400 flex items-center gap-2 relative text-base"
                onClick={handleShare}
              >
                <span className="hidden md:inline">Share post</span>
                <Share className="h-5 w-5" />
                {showCopiedFeedback && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm bg-muted text-foreground px-2 py-1 rounded whitespace-nowrap">
                    URL copied!
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row lg:gap-12">
          {/* Author Info - Left Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 mb-4 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex flex-col gap-2 lg:gap-8 not-prose bg-muted/30 rounded-xl p-3 lg:p-8 border border-border/40">
                {/* Profile Header */}
                <div className="flex justify-between items-start">
                  <Link
                    href={`https://x.com/${author.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 hover:opacity-90 transition-opacity"
                  >
                    <Avatar className="h-10 lg:h-14 w-10 lg:w-14 border-2 border-border/40">
                      <AvatarImage src={author.profile_image_url} />
                      <AvatarFallback>
                        {author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base lg:text-xl font-semibold text-foreground break-words">
                          {author.name}
                        </h2>
                        {author.verified && <VerifiedBadge />}
                      </div>
                      <p className="text-muted-foreground text-sm break-words">
                        @{author.username}
                      </p>
                    </div>
                  </Link>
                  <div className="lg:hidden text-sm text-muted-foreground">
                    Joined{" "}
                    {new Date(author.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Bio */}
                {author.description && (
                  <p className="text-foreground text-sm leading-relaxed border-t border-border/40 pt-2 lg:pt-0 lg:border-0">
                    {(() => {
                      const urlRegex = /https?:\/\/[^\s]+/g;
                      const matches = [
                        ...author.description.matchAll(urlRegex),
                      ];

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
                            here
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

                {/* Stats */}
                <div className="flex flex-col lg:flex-col gap-1.5 lg:gap-2.5 text-sm border-t border-border/40 pt-2 lg:pt-6">
                  <div className="flex items-center gap-4 lg:gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {formatNumber(author.followers_count)}
                      </span>
                      <span className="text-muted-foreground">Followers</span>
                    </div>
                    {author.following_count && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">
                          {formatNumber(author.following_count)}
                        </span>
                        <span className="text-muted-foreground">Following</span>
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="text-foreground">
                      {new Date(author.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Blog Content - Right Side */}
          <article className="flex-1 max-w-4xl">
            <div className="prose dark:prose-invert prose-xl prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground">
              <div className="space-y-8">
                <h1 className="text-4xl font-bold mb-6 text-foreground">
                  {blogifiedContent.title}
                </h1>
                <div>
                  <div className="space-y-2">
                    <MarkdownWithMedia
                      content={{
                        content: blogifiedContent.content,
                        title: "",
                        summary: blogifiedContent.summary,
                      }}
                      media={blogifiedContent.media}
                    />
                  </div>
                  {Object.values(blogifiedContent.media).some(
                    (a) => a.type === "link"
                  ) && (
                    <div className="mt-4">
                      <Attachment
                        attachments={Object.values(
                          blogifiedContent.media
                        ).filter((a) => a.type === "link")}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="relative mt-24">
                <footer className="pt-6 border-t border-border">
                  <div className="flex items-center justify-between text-base text-muted-foreground">
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
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
