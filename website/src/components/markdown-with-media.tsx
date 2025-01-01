import React from "react";
import ReactMarkdown from "react-markdown";
import { Attachment } from "@/types";
import { Components } from "react-markdown";

interface MarkdownWithMediaProps {
  content: {
    content: string;
    title: string;
    summary: string;
  };
  media: Record<string, Attachment>;
}

function MediaRenderer({ type, ...props }: Attachment) {
  // Skip rendering if URL is empty or invalid
  if (!props.url) return null;

  switch (type) {
    case "image":
      return (
        <div className="rounded-lg overflow-hidden bg-gray-800">
          <img
            src={props.url}
            alt={props.description || "Image"}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      );
    case "video":
      return (
        <div className="rounded-lg overflow-hidden bg-black aspect-video">
          <video
            poster={props.thumbnail_url || undefined}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <source src={props.url} type="video/mp4" />
          </video>
        </div>
      );
    case "link":
      return (
        <a
          href={props.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-4 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-all hover:border-gray-700"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 text-blue-400 group-hover:text-gray-100 transition-colors truncate">
                {props.title || props.url}
              </h3>
              {props.description && (
                <p className="text-gray-400 line-clamp-2">
                  {props.description}
                </p>
              )}
            </div>
            <svg
              className="h-5 w-5 text-blue-400 group-hover:text-gray-100 transition-colors flex-shrink-0"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 7h10v10" />
              <path d="M7 17 17 7" />
            </svg>
          </div>
        </a>
      );
    default:
      return null;
  }
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-6 text-gray-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-semibold mb-4 text-gray-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold mb-4 text-gray-200">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl font-semibold mb-3 text-gray-200">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-lg leading-relaxed mb-4 text-gray-300">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 text-gray-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 text-gray-300">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-2">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-700 pl-4 my-4 italic text-gray-400">
      {children}
    </blockquote>
  ),
};

export function MarkdownWithMedia({ content, media }: MarkdownWithMediaProps) {
  // First replace markdown image/media syntax with our placeholders
  const processedContent = content.content.replace(
    /!\[([^\]]*)\]\(media:(\d+)\)/g,
    "{media:$2}"
  );

  // Split content by media placeholders
  const parts = processedContent.split(/(\{media:\d+\})/);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <ReactMarkdown components={components}>
          {"# " + content.title}
        </ReactMarkdown>
        <p className="text-xl text-gray-400 mt-4">{content.summary}</p>
      </div>
      <div className="space-y-6">
        {parts.map((part, index) => {
          const mediaMatch = part.match(/\{media:(\d+)\}/);
          if (mediaMatch) {
            const mediaId = mediaMatch[1];
            const mediaItem = media[mediaId];
            return mediaItem ? (
              <div key={`media-${index}`}>
                {(mediaItem.type === "image" || mediaItem.type === "video") && (
                  <div className="mx-auto max-w-2xl">
                    <MediaRenderer {...mediaItem} />
                  </div>
                )}
                {mediaItem.type === "link" && (
                  <div className="mt-4">
                    <MediaRenderer {...mediaItem} />
                  </div>
                )}
              </div>
            ) : null;
          }

          return part ? (
            <ReactMarkdown key={`text-${index}`} components={components}>
              {part}
            </ReactMarkdown>
          ) : null;
        })}
      </div>
    </div>
  );
}
