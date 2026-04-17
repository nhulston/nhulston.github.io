import type { DragEvent, FormEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type {
  BlogPost,
  BlogPostFormData,
  BlogPostPayload,
  FAQFormData,
  FAQItem,
  LoadStatus,
} from "../types";

const DEFAULT_BLOG_AUTHOR = "Randy Kirsch";

function padDatePart(value: number): string {
  return value.toString().padStart(2, "0");
}

function getTodayDateInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
}

function getUtcDateInputValue(value: string): string {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;
}

function getPublishedAtPayload(value: string): string {
  return `${value}T00:00:00Z`;
}

function formatPublishedDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function createEmptyBlogForm(): BlogPostFormData {
  return {
    title: "",
    author: DEFAULT_BLOG_AUTHOR,
    summary: "",
    slug: "",
    body_markdown: "",
    published: true,
    published_at: getTodayDateInputValue(),
  };
}

function createEmptyFaqForm(): FAQFormData {
  return {
    question: "",
    answer_markdown: "",
    published: true,
  };
}

function reorderFaqList(items: FAQItem[], sourceId: number, targetId: number): FAQItem[] | null {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return null;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);

  return nextItems.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export function AdminPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [blogForm, setBlogForm] = useState<BlogPostFormData>(createEmptyBlogForm);
  const [faqForm, setFaqForm] = useState<FAQFormData>(createEmptyFaqForm);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draggedFaqId, setDraggedFaqId] = useState<number | null>(null);
  const [dropTargetFaqId, setDropTargetFaqId] = useState<number | null>(null);
  const [isReorderingFaqs, setIsReorderingFaqs] = useState(false);

  async function loadAll(): Promise<void> {
    setStatus("loading");
    setError("");
    try {
      const [blogData, faqData] = await Promise.all([
        api.getAdminBlogPosts(),
        api.getAdminFaqs(),
      ]);
      setBlogPosts(blogData);
      setFaqs(faqData);
      setStatus("ready");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      setStatus("error");
    }
  }

  useEffect(() => {
    document.body.classList.add("admin-site");
    void loadAll();

    return () => {
      document.body.classList.remove("admin-site");
    };
  }, []);

  function resetBlogEditor(): void {
    setEditingBlogId(null);
    setBlogForm(createEmptyBlogForm());
  }

  function resetFaqEditor(): void {
    setEditingFaqId(null);
    setFaqForm(createEmptyFaqForm());
  }

  function closeBlogEditor(): void {
    setIsBlogDialogOpen(false);
    resetBlogEditor();
  }

  function closeFaqEditor(): void {
    setIsFaqDialogOpen(false);
    resetFaqEditor();
  }

  function openNewBlogEditor(): void {
    resetBlogEditor();
    setIsBlogDialogOpen(true);
  }

  function openEditBlogEditor(post: BlogPost): void {
    setEditingBlogId(post.id);
    setBlogForm({
      title: post.title,
      author: post.author,
      summary: post.summary,
      slug: post.slug,
      body_markdown: post.body_markdown,
      published: post.published,
      published_at: getUtcDateInputValue(post.published_at || post.created_at),
    });
    setIsBlogDialogOpen(true);
  }

  function openNewFaqEditor(): void {
    resetFaqEditor();
    setIsFaqDialogOpen(true);
  }

  function openEditFaqEditor(faq: FAQItem): void {
    setEditingFaqId(faq.id);
    setFaqForm({
      question: faq.question,
      answer_markdown: faq.answer_markdown,
      published: faq.published,
    });
    setIsFaqDialogOpen(true);
  }

  function handleDialogClick(event: MouseEvent<HTMLDivElement>): void {
    event.stopPropagation();
  }

  async function handleBlogSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice("");
    setError("");

    const payload: BlogPostPayload = {
      ...blogForm,
      author: blogForm.author.trim(),
      published_at: getPublishedAtPayload(blogForm.published_at),
      slug: blogForm.slug.trim() || null,
    };

    try {
      if (editingBlogId) {
        await api.updateBlogPost(editingBlogId, payload);
        setNotice("Blog post updated.");
      } else {
        await api.createBlogPost(payload);
        setNotice("Blog post created.");
      }
      closeBlogEditor();
      await loadAll();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleFaqSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      if (editingFaqId) {
        await api.updateFaq(editingFaqId, faqForm);
        setNotice("FAQ updated.");
      } else {
        await api.createFaq(faqForm);
        setNotice("FAQ created.");
      }
      closeFaqEditor();
      await loadAll();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleDeleteBlog(id: number): Promise<void> {
    if (!window.confirm("Delete this blog post?")) {
      return;
    }
    try {
      await api.deleteBlogPost(id);
      setNotice("Blog post deleted.");
      if (editingBlogId === id) {
        closeBlogEditor();
      }
      await loadAll();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleDeleteFaq(id: number): Promise<void> {
    if (!window.confirm("Delete this FAQ?")) {
      return;
    }
    try {
      await api.deleteFaq(id);
      setNotice("FAQ deleted.");
      if (editingFaqId === id) {
        closeFaqEditor();
      }
      await loadAll();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    }
  }

  function handleFaqDragStart(event: DragEvent<HTMLButtonElement>, faqId: number): void {
    if (isReorderingFaqs) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(faqId));
    setDraggedFaqId(faqId);
    setDropTargetFaqId(faqId);
  }

  function handleFaqDragOver(event: DragEvent<HTMLElement>, faqId: number): void {
    if (draggedFaqId === null || draggedFaqId === faqId || isReorderingFaqs) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetFaqId(faqId);
  }

  function handleFaqDragEnd(): void {
    setDraggedFaqId(null);
    setDropTargetFaqId(null);
  }

  async function handleFaqDrop(targetFaqId: number): Promise<void> {
    if (draggedFaqId === null || isReorderingFaqs) {
      return;
    }

    setDropTargetFaqId(null);

    const previousFaqs = faqs;
    const reorderedFaqs = reorderFaqList(previousFaqs, draggedFaqId, targetFaqId);
    setDraggedFaqId(null);

    if (reorderedFaqs === null) {
      return;
    }

    setFaqs(reorderedFaqs);
    setNotice("");
    setError("");
    setIsReorderingFaqs(true);

    try {
      const savedFaqs = await api.reorderFaqs(reorderedFaqs.map((faq) => faq.id));
      setFaqs(savedFaqs);
      setNotice("FAQ order updated.");
    } catch (requestError: unknown) {
      setFaqs(previousFaqs);
      setError(getErrorMessage(requestError));
    } finally {
      setIsReorderingFaqs(false);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header admin-hero">
        <div className="admin-hero-copy">
          <h1>Admin</h1>
        </div>
        <div className="admin-hero-actions">
          <div className="admin-stat-row">
            <div className="admin-stat">
              <span className="admin-stat-label">FAQs</span>
              <strong>{faqs.length}</strong>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label">Posts</span>
              <strong>{blogPosts.length}</strong>
            </div>
          </div>
          <a className="button button-secondary" href="/">
            View site
          </a>
        </div>
      </header>

      <div className="admin-alerts">
        {notice ? <p className="notice success">{notice}</p> : null}
        {error ? <p className="notice error">{error}</p> : null}
        {status === "loading" ? <p className="notice">Loading content...</p> : null}
      </div>

      <div className="admin-sections">
        <section className="admin-panel admin-panel-faq admin-section">
          <div className="panel-heading">
            <h2>FAQs</h2>
            <button className="button button-ghost" onClick={openNewFaqEditor} type="button">
              New FAQ
            </button>
          </div>

          <div aria-busy={isReorderingFaqs} className="admin-list">
            {faqs.map((faq) => (
              <article
                className={`admin-list-item${draggedFaqId === faq.id ? " dragging" : ""}${
                  dropTargetFaqId === faq.id && draggedFaqId !== faq.id ? " drop-target" : ""
                }`}
                key={faq.id}
                onDragOver={(event) => handleFaqDragOver(event, faq.id)}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleFaqDrop(faq.id);
                }}
              >
                <div className="admin-item-top">
                  <div className="admin-item-heading">
                    <button
                      aria-label={`Reorder ${faq.question}`}
                      className="faq-drag-handle"
                      disabled={isReorderingFaqs}
                      draggable={!isReorderingFaqs}
                      onDragEnd={handleFaqDragEnd}
                      onDragStart={(event) => handleFaqDragStart(event, faq.id)}
                      type="button"
                    >
                      Reorder
                    </button>
                    <div>
                      <h3>{faq.question}</h3>
                    </div>
                  </div>
                  <span className={`pill${faq.published ? " live" : ""}`}>
                    {faq.published ? "Published" : "Hidden"}
                  </span>
                </div>
                <p className="admin-item-preview">{faq.answer_markdown.slice(0, 180)}</p>
                <div className="row-actions">
                  <button
                    className="button button-ghost"
                    onClick={() => openEditFaqEditor(faq)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="button button-danger"
                    onClick={() => handleDeleteFaq(faq.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {faqs.length === 0 ? <p className="empty-state">No FAQs yet.</p> : null}
          </div>
        </section>

        <section className="admin-panel admin-panel-blog admin-section">
          <div className="panel-heading">
            <h2>Blog Posts</h2>
            <button className="button button-ghost" onClick={openNewBlogEditor} type="button">
              New post
            </button>
          </div>

          <div className="admin-list">
            {blogPosts.map((post) => (
              <article className="admin-list-item" key={post.id}>
                <div className="admin-item-top">
                  <div>
                    <h3>{post.title}</h3>
                    <p className="admin-item-meta">
                      {formatPublishedDate(post.published_at || post.created_at)}
                      {post.author ? ` • ${post.author}` : ""}
                      {` • /${post.slug}`}
                    </p>
                  </div>
                  <span className={`pill${post.published ? " live" : ""}`}>
                    {post.published ? "Published" : "Hidden"}
                  </span>
                </div>
                <p className="admin-item-preview">{post.summary || "No summary yet."}</p>
                <div className="row-actions">
                  <button
                    className="button button-ghost"
                    onClick={() => openEditBlogEditor(post)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="button button-danger"
                    onClick={() => handleDeleteBlog(post.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {blogPosts.length === 0 ? <p className="empty-state">No blog posts yet.</p> : null}
          </div>
        </section>
      </div>

      {isFaqDialogOpen ? (
        <div className="admin-dialog-backdrop" onClick={closeFaqEditor} role="presentation">
          <div
            aria-labelledby="faq-dialog-title"
            aria-modal="true"
            className="admin-dialog"
            onClick={handleDialogClick}
            role="dialog"
          >
            <form className="editor-form admin-editor" onSubmit={handleFaqSubmit}>
              <div className="admin-dialog-header">
                <h3 id="faq-dialog-title">{editingFaqId ? "Edit FAQ" : "New FAQ"}</h3>
                <button className="button button-ghost" onClick={closeFaqEditor} type="button">
                  Close
                </button>
              </div>
              <label>
                Question
                <input
                  onChange={(event) =>
                    setFaqForm((current) => ({
                      ...current,
                      question: event.target.value,
                    }))
                  }
                  required
                  type="text"
                  value={faqForm.question}
                />
              </label>
              <label>
                Answer
                <textarea
                  onChange={(event) =>
                    setFaqForm((current) => ({
                      ...current,
                      answer_markdown: event.target.value,
                    }))
                  }
                  required
                  rows={10}
                  value={faqForm.answer_markdown}
                />
              </label>
              <label className="checkbox-row">
                <input
                  checked={faqForm.published}
                  onChange={(event) =>
                    setFaqForm((current) => ({
                      ...current,
                      published: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Published
              </label>
              <div className="admin-dialog-actions">
                <button className="button button-ghost" onClick={closeFaqEditor} type="button">
                  Cancel
                </button>
                <button className="button button-primary" type="submit">
                  {editingFaqId ? "Update FAQ" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isBlogDialogOpen ? (
        <div className="admin-dialog-backdrop" onClick={closeBlogEditor} role="presentation">
          <div
            aria-labelledby="blog-dialog-title"
            aria-modal="true"
            className="admin-dialog admin-dialog-wide"
            onClick={handleDialogClick}
            role="dialog"
          >
            <form className="editor-form admin-editor" onSubmit={handleBlogSubmit}>
              <div className="admin-dialog-header">
                <h3 id="blog-dialog-title">{editingBlogId ? "Edit post" : "New post"}</h3>
                <button className="button button-ghost" onClick={closeBlogEditor} type="button">
                  Close
                </button>
              </div>
              <label>
                Title
                <input
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                  type="text"
                  value={blogForm.title}
                />
              </label>
              <label>
                Author
                <input
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      author: event.target.value,
                    }))
                  }
                  type="text"
                  value={blogForm.author}
                />
              </label>
              <label>
                Published date
                <input
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      published_at: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={blogForm.published_at}
                />
              </label>
              <label>
                Summary
                <textarea
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  rows={3}
                  value={blogForm.summary}
                />
              </label>
              <label>
                Slug
                <input
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="leave blank to auto-generate"
                  type="text"
                  value={blogForm.slug}
                />
              </label>
              <label>
                Body
                <textarea
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      body_markdown: event.target.value,
                    }))
                  }
                  required
                  rows={14}
                  value={blogForm.body_markdown}
                />
              </label>
              <label className="checkbox-row">
                <input
                  checked={blogForm.published}
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      published: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Published
              </label>
              <div className="admin-dialog-actions">
                <button className="button button-ghost" onClick={closeBlogEditor} type="button">
                  Cancel
                </button>
                <button className="button button-primary" type="submit">
                  {editingBlogId ? "Update post" : "Create post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
