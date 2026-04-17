import type {
  BlogPost,
  BlogPostPayload,
  FAQFormData,
  FAQItem,
  FAQPublicSection,
  FAQSection,
  FAQSectionFormData,
} from "../types";

const jsonHeaders: HeadersInit = {
  "Content-Type": "application/json",
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as { detail?: string } | T | null;
  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? data.detail || "Request failed."
        : "Request failed.";
    throw new Error(detail);
  }

  return data as T;
}

export const api = {
  getPublicFaqs: () => request<FAQPublicSection[]>("/api/public/faqs"),
  getPublicBlogPosts: () => request<BlogPost[]>("/api/public/blog-posts"),
  getPublicBlogPost: (slug: string) => request<BlogPost>(`/api/public/blog-posts/${slug}`),
  getAdminFaqSections: () => request<FAQSection[]>("/api/admin/faq-sections"),
  createFaqSection: (payload: FAQSectionFormData) =>
    request<FAQSection>("/api/admin/faq-sections", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  updateFaqSection: (id: number, payload: FAQSectionFormData) =>
    request<FAQSection>(`/api/admin/faq-sections/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  reorderFaqSections: (sectionIds: number[]) =>
    request<FAQSection[]>("/api/admin/faq-sections/reorder", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ section_ids: sectionIds }),
    }),
  deleteFaqSection: (id: number) =>
    request<void>(`/api/admin/faq-sections/${id}`, {
      method: "DELETE",
    }),
  getAdminFaqs: () => request<FAQItem[]>("/api/admin/faqs"),
  createFaq: (payload: FAQFormData) =>
    request<FAQItem>("/api/admin/faqs", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  reorderFaqs: (sectionId: number, faqIds: number[]) =>
    request<FAQItem[]>(`/api/admin/faq-sections/${sectionId}/faqs/reorder`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ faq_ids: faqIds }),
    }),
  updateFaq: (id: number, payload: FAQFormData) =>
    request<FAQItem>(`/api/admin/faqs/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  deleteFaq: (id: number) =>
    request<void>(`/api/admin/faqs/${id}`, {
      method: "DELETE",
    }),
  getAdminBlogPosts: () => request<BlogPost[]>("/api/admin/blog-posts"),
  createBlogPost: (payload: BlogPostPayload) =>
    request<BlogPost>("/api/admin/blog-posts", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  updateBlogPost: (id: number, payload: BlogPostPayload) =>
    request<BlogPost>(`/api/admin/blog-posts/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }),
  deleteBlogPost: (id: number) =>
    request<void>(`/api/admin/blog-posts/${id}`, {
      method: "DELETE",
    }),
};
