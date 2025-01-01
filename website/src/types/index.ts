export interface Attachment {
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

export interface BlogPost {
  content: string;
  title: string;
  summary: string;
  media: Record<string, Attachment>;
  created_at: string;
}
