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
  faq_section_id: number;
  section: FAQSection;
  question: string;
  answer_markdown: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQSection {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FAQPublicSection extends FAQSection {
  items: FAQPublicItem[];
}

export interface FAQPublicItem {
  id: number;
  question: string;
  answer_markdown: string;
  sort_order: number;
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
  faq_section_id: number;
  question: string;
  answer_markdown: string;
  published: boolean;
}

export interface FAQSectionFormData {
  name: string;
}
