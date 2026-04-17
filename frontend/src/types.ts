export type LoadStatus = "loading" | "ready" | "error";

export interface BlogPost {
  id: number;
  title: string;
  author: string;
  summary: string;
  slug: string;
  body_markdown: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: number;
  section: string;
  question: string;
  answer_markdown: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormData {
  title: string;
  author: string;
  summary: string;
  slug: string;
  body_markdown: string;
  published: boolean;
  published_at: string;
}

export interface BlogPostPayload extends Omit<BlogPostFormData, "slug" | "published_at"> {
  slug: string | null;
  published_at: string;
}

export interface FAQFormData {
  section: string;
  question: string;
  answer_markdown: string;
  published: boolean;
}

export interface FAQOrderItem {
  id: number;
  section: string;
}
