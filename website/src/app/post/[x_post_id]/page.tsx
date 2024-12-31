"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Repeat2, Share, Twitter } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Types for our thread data
interface Tweet {
  username: string;
  timestamp: string;
  text: string;
  metrics: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

interface ThreadData {
  mainTweet: Tweet;
  replies: Tweet[];
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
        // We'll implement the API endpoint later
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

  const { mainTweet } = threadData;
  const originalUrl = `https://x.com/${mainTweet.username}/status/${postId}`;

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

            {/* Interaction Buttons */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400"
                >
                  <MessageCircle className="h-5 w-5 mr-1" />
                  <span>{mainTweet.metrics.replies}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-green-400"
                >
                  <Repeat2 className="h-5 w-5 mr-1" />
                  <span>{mainTweet.metrics.retweets}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-pink-400"
                >
                  <Heart className="h-5 w-5 mr-1" />
                  <span>{mainTweet.metrics.likes}</span>
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
          <div className="flex items-center gap-4 mb-8 not-prose">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`https://unavatar.io/twitter/${mainTweet.username}`}
              />
              <AvatarFallback>
                {mainTweet.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-xl text-gray-100">
                  {mainTweet.username}
                </h2>
                <span className="text-gray-400">@{mainTweet.username}</span>
              </div>
              <time className="text-gray-400 text-sm">
                {new Date(mainTweet.timestamp).toLocaleString()} ·{" "}
                {threadData.replies.length + 1} part thread
              </time>
            </div>
          </div>

          {/* Thread Content */}
          <div className="space-y-6">
            {/* Main Tweet */}
            <div className="prose prose-invert">
              <p>{mainTweet.text}</p>
            </div>

            {/* Replies */}
            {threadData.replies.map((tweet, index) => (
              <div key={index} className="pt-6 border-t border-gray-800">
                <p>{tweet.text}</p>
                <time className="text-sm text-gray-400 mt-2 block">
                  {new Date(tweet.timestamp).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        </article>

        {/* Footer with original post timestamp */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <time>
              Originally posted at{" "}
              {new Date(mainTweet.timestamp).toLocaleString()}
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
