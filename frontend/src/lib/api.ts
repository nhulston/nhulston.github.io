import type {
  BlogPost,
  BlogPostPayload,
  FAQFormData,
  FAQItem,
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
  getPublicFaqs: () => request<FAQItem[]>("/api/public/faqs"),
  getPublicBlogPosts: () => request<BlogPost[]>("/api/public/blog-posts"),
  getPublicBlogPost: (slug: string) => request<BlogPost>(`/api/public/blog-posts/${slug}`),
  getAdminFaqs: () => request<FAQItem[]>("/api/admin/faqs"),
  createFaq: (payload: FAQFormData) =>
    request<FAQItem>("/api/admin/faqs", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
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
