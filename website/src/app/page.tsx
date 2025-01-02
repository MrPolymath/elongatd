"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Chrome } from "lucide-react";
import Link from "next/link";

interface Thread {
  id: string;
  author_name: string;
  author_username: string;
  author_profile_image_url: string;
  author_verified: boolean;
  created_at: string;
  added_at: string;
  total_likes: number;
  total_retweets: number;
  total_replies: number;
  tweets: { text: string }[];
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // Fetch latest threads
    fetch("/api/threads/latest")
      .then((res) => res.json())
      .then((data) => {
        setThreads(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching threads:", error);
        setLoading(false);
      });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl">Loading threads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="text-xl font-bold">
              Elongatd
            </Link>
            <div className="flex items-center gap-4">
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
              <Button
                variant="default"
                size="sm"
                className="rounded-full gap-2"
                onClick={() =>
                  window.open(
                    "https://chrome.google.com/webstore/detail/your-extension-id",
                    "_blank"
                  )
                }
              >
                <Chrome className="h-4 w-4" />
                Install Extension
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Latest Elongated Threads</h1>
          </div>

          <div className="grid gap-6">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/post/${thread.id}`}
                className="block group"
              >
                <article className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thread.author_profile_image_url}
                          alt={thread.author_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">
                              {thread.author_name}
                            </span>
                            {thread.author_verified && (
                              <span className="text-blue-400">✓</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{thread.author_username}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-col items-end gap-1">
                        <div>{formatRelativeTime(thread.added_at)}</div>
                      </div>
                    </div>

                    <p className="line-clamp-3 text-base">
                      {thread.tweets[0]?.text}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {formatNumber(thread.total_replies)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            replies
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {formatNumber(thread.total_retweets)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            retweets
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {formatNumber(thread.total_likes)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            likes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
