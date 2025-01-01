import React from "react";
import ReactMarkdown from "react-markdown";
import { Attachment } from "@/types";
import { Components } from "react-markdown";
import { ImageCarousel } from "./image-carousel";

interface MarkdownWithMediaProps {
  content: {
    content: string;
    title: string;
    summary: string;
  };
  media: Record<string, Attachment>;
}

function MediaRenderer({ attachments }: { attachments: Attachment[] }) {
  // Group attachments by type
  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
  const links = attachments.filter((a) => a.type === "link");

  return (
    <div className="space-y-4">
      {/* Render images in carousel */}
      {images.length > 0 && (
        <ImageCarousel
          images={images.map((img) => ({
            url: img.url,
            width: img.width,
            height: img.height,
          }))}
        />
      )}

      {/* Render videos */}
      {videos.map((video, index) => (
        <div
          key={index}
          className="rounded-lg overflow-hidden bg-black aspect-video"
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
          className="group block p-4 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-all hover:border-gray-700"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 text-blue-400 group-hover:text-gray-100 transition-colors truncate">
                {link.title || link.url}
              </h3>
              {link.description && (
                <p className="text-gray-400 line-clamp-2">{link.description}</p>
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
      ))}
    </div>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-6 text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-semibold mb-4 text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold mb-4 text-foreground">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl font-semibold mb-3 text-foreground">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-lg leading-relaxed mb-4 text-foreground">{children}</p>
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
    <ul className="list-disc list-inside mb-4 text-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 text-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mb-2">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-4 my-4 italic text-muted-foreground">
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

  // Split content by media placeholders but keep the delimiters
  const parts = processedContent.split(/({media:\d+})/);

  // Process parts to group consecutive images
  const processedParts: (string | { type: string; items: Attachment[] })[] = [];
  let currentImageGroup: Attachment[] = [];

  parts.forEach((part) => {
    const mediaMatch = part.match(/\{media:(\d+)\}/);
    if (mediaMatch) {
      const mediaId = mediaMatch[1];
      const mediaItem = media[mediaId];
      if (mediaItem) {
        if (mediaItem.type === "image") {
          currentImageGroup.push(mediaItem);
        } else {
          // If we have a non-image media and there were images before, flush the image group
          if (currentImageGroup.length > 0) {
            processedParts.push({
              type: "image-group",
              items: [...currentImageGroup],
            });
            currentImageGroup = [];
          }
          processedParts.push({ type: mediaItem.type, items: [mediaItem] });
        }
      }
    } else if (part.trim()) {
      // If we have images and encounter text, flush the image group
      if (currentImageGroup.length > 0) {
        processedParts.push({
          type: "image-group",
          items: [...currentImageGroup],
        });
        currentImageGroup = [];
      }
      processedParts.push(part);
    }
  });

  // Handle any remaining images
  if (currentImageGroup.length > 0) {
    processedParts.push({ type: "image-group", items: [...currentImageGroup] });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <ReactMarkdown components={components}>
          {"# " + content.title}
        </ReactMarkdown>
        <p className="text-xl text-muted-foreground mt-4">{content.summary}</p>
      </div>
      <div className="space-y-6">
        {processedParts.map((part, index) => {
          if (typeof part === "string") {
            return (
              <ReactMarkdown key={`text-${index}`} components={components}>
                {part}
              </ReactMarkdown>
            );
          }

          if (part.type === "image-group") {
            return (
              <div key={`media-${index}`} className="mx-auto max-w-2xl">
                <MediaRenderer attachments={part.items} />
              </div>
            );
          }

          if (part.type === "video") {
            return (
              <div key={`media-${index}`} className="mx-auto max-w-2xl">
                <MediaRenderer attachments={part.items} />
              </div>
            );
          }

          if (part.type === "link") {
            return (
              <div key={`media-${index}`} className="mt-4">
                <MediaRenderer attachments={part.items} />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
