export type LoadStatus = "loading" | "ready" | "error";

export interface BlogPost {
  id: number;
  title: string;
  summary: string;
  slug: string;
  body_markdown: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer_markdown: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormData {
  title: string;
  summary: string;
  slug: string;
  body_markdown: string;
  published: boolean;
}

export interface BlogPostPayload extends Omit<BlogPostFormData, "slug"> {
  slug: string | null;
}

export interface FAQFormData {
  question: string;
  answer_markdown: string;
  sort_order: number;
  published: boolean;
}

