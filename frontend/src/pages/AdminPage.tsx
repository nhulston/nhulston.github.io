import type { DragEvent, FormEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type {
  BlogPost,
  BlogPostFormData,
  BlogPostPayload,
  FAQFormData,
  FAQItem,
  FAQSection,
  FAQSectionFormData,
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
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(
    date.getUTCDate(),
  )}`;
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

function createEmptyFaqForm(sectionId: number | null = null): FAQFormData {
  return {
    faq_section_id: sectionId ?? 0,
    question: "",
    answer_markdown: "",
    published: true,
  };
}

function createEmptySectionForm(): FAQSectionFormData {
  return {
    name: "",
  };
}

function reorderSections(items: FAQSection[], sourceId: number, targetId: number): FAQSection[] | null {
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

function reorderFaqsWithinSection(
  items: FAQItem[],
  sectionId: number,
  sourceId: number,
  targetId: number,
): FAQItem[] | null {
  const sectionFaqs = items
    .filter((item) => item.faq_section_id === sectionId)
    .sort((a, b) => a.sort_order - b.sort_order);
  const sourceIndex = sectionFaqs.findIndex((item) => item.id === sourceId);
  const targetIndex = sectionFaqs.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return null;
  }

  const reorderedSectionFaqs = [...sectionFaqs];
  const [movedItem] = reorderedSectionFaqs.splice(sourceIndex, 1);
  reorderedSectionFaqs.splice(targetIndex, 0, movedItem);

  const updatedSortOrders = new Map<number, number>();
  reorderedSectionFaqs.forEach((item, index) => {
    updatedSortOrders.set(item.id, index);
  });

  return items.map((item) =>
    item.faq_section_id === sectionId
      ? {
          ...item,
          sort_order: updatedSortOrders.get(item.id) ?? item.sort_order,
        }
      : item,
  );
}

export function AdminPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [faqSections, setFaqSections] = useState<FAQSection[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [blogForm, setBlogForm] = useState<BlogPostFormData>(createEmptyBlogForm);
  const [faqForm, setFaqForm] = useState<FAQFormData>(() => createEmptyFaqForm());
  const [sectionForm, setSectionForm] = useState<FAQSectionFormData>(createEmptySectionForm);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draggedFaqId, setDraggedFaqId] = useState<number | null>(null);
  const [draggedFaqSectionId, setDraggedFaqSectionId] = useState<number | null>(null);
  const [dropTargetFaqId, setDropTargetFaqId] = useState<number | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);
  const [dropTargetSectionId, setDropTargetSectionId] = useState<number | null>(null);
  const [isReorderingFaqs, setIsReorderingFaqs] = useState(false);
  const [isReorderingSections, setIsReorderingSections] = useState(false);

  async function loadAll(): Promise<void> {
    setStatus("loading");
    setError("");
    try {
      const [blogData, sectionData, faqData] = await Promise.all([
        api.getAdminBlogPosts(),
        api.getAdminFaqSections(),
        api.getAdminFaqs(),
      ]);
      setBlogPosts(blogData);
      setFaqSections(sectionData);
      setFaqs(faqData);
      setStatus("ready");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      setStatus("error");
    }
  }

  useEffect(() => {
    document.documentElement.classList.add("admin-site");
    document.body.classList.add("admin-site");
    void loadAll();

    return () => {
      document.documentElement.classList.remove("admin-site");
      document.body.classList.remove("admin-site");
    };
  }, []);

  const faqCountsBySection = useMemo(() => {
    const counts = new Map<number, number>();
    faqs.forEach((faq) => {
      counts.set(faq.faq_section_id, (counts.get(faq.faq_section_id) ?? 0) + 1);
    });
    return counts;
  }, [faqs]);

  function resetBlogEditor(): void {
    setEditingBlogId(null);
    setBlogForm(createEmptyBlogForm());
  }

  function resetFaqEditor(): void {
    setEditingFaqId(null);
    setFaqForm(createEmptyFaqForm(faqSections[0]?.id ?? null));
  }

  function resetSectionEditor(): void {
    setEditingSectionId(null);
    setSectionForm(createEmptySectionForm());
  }

  function closeBlogEditor(): void {
    setIsBlogDialogOpen(false);
    resetBlogEditor();
  }

  function closeFaqEditor(): void {
    setIsFaqDialogOpen(false);
    resetFaqEditor();
  }

  function closeSectionEditor(): void {
    setIsSectionDialogOpen(false);
    resetSectionEditor();
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
      published_at: getUtcDateInputValue(post.published_at),
    });
    setIsBlogDialogOpen(true);
  }

  function openNewFaqEditor(): void {
    if (faqSections.length === 0) {
      setError("Create a FAQ section first.");
      return;
    }

    setEditingFaqId(null);
    setFaqForm(createEmptyFaqForm(faqSections[0].id));
    setIsFaqDialogOpen(true);
  }

  function openEditFaqEditor(faq: FAQItem): void {
    setEditingFaqId(faq.id);
    setFaqForm({
      faq_section_id: faq.faq_section_id,
      question: faq.question,
      answer_markdown: faq.answer_markdown,
      published: faq.published,
    });
    setIsFaqDialogOpen(true);
  }

  function openNewSectionEditor(): void {
    resetSectionEditor();
    setIsSectionDialogOpen(true);
  }

  function openEditSectionEditor(section: FAQSection): void {
    setEditingSectionId(section.id);
    setSectionForm({
      name: section.name,
    });
    setIsSectionDialogOpen(true);
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

  async function handleSectionSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice("");
    setError("");

    const payload: FAQSectionFormData = {
      name: sectionForm.name.trim(),
    };

    try {
      if (editingSectionId) {
        await api.updateFaqSection(editingSectionId, payload);
        setNotice("FAQ section updated.");
      } else {
        await api.createFaqSection(payload);
        setNotice("FAQ section created.");
      }
      closeSectionEditor();
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

  async function handleDeleteSection(id: number): Promise<void> {
    if (!window.confirm("Delete this FAQ section?")) {
      return;
    }
    try {
      await api.deleteFaqSection(id);
      setNotice("FAQ section deleted.");
      if (editingSectionId === id) {
        closeSectionEditor();
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

  function handleSectionDragStart(event: DragEvent<HTMLButtonElement>, sectionId: number): void {
    if (isReorderingSections) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(sectionId));
    setDraggedSectionId(sectionId);
    setDropTargetSectionId(sectionId);
  }

  function handleSectionDragOver(event: DragEvent<HTMLElement>, sectionId: number): void {
    if (draggedSectionId === null || draggedSectionId === sectionId || isReorderingSections) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetSectionId(sectionId);
  }

  function handleSectionDragEnd(): void {
    setDraggedSectionId(null);
    setDropTargetSectionId(null);
  }

  async function handleSectionDrop(targetSectionId: number): Promise<void> {
    if (draggedSectionId === null || isReorderingSections) {
      return;
    }

    const previousSections = faqSections;
    const reorderedSections = reorderSections(previousSections, draggedSectionId, targetSectionId);
    setDraggedSectionId(null);
    setDropTargetSectionId(null);

    if (reorderedSections === null) {
      return;
    }

    setFaqSections(reorderedSections);
    setNotice("");
    setError("");
    setIsReorderingSections(true);

    try {
      const savedSections = await api.reorderFaqSections(reorderedSections.map((section) => section.id));
      setFaqSections(savedSections);
      setNotice("FAQ section order updated.");
    } catch (requestError: unknown) {
      setFaqSections(previousSections);
      setError(getErrorMessage(requestError));
    } finally {
      setIsReorderingSections(false);
    }
  }

  function handleFaqDragStart(
    event: DragEvent<HTMLButtonElement>,
    faqId: number,
    sectionId: number,
  ): void {
    if (isReorderingFaqs) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(faqId));
    setDraggedFaqId(faqId);
    setDraggedFaqSectionId(sectionId);
    setDropTargetFaqId(faqId);
  }

  function handleFaqDragOver(event: DragEvent<HTMLElement>, faqId: number, sectionId: number): void {
    if (
      draggedFaqId === null ||
      draggedFaqId === faqId ||
      draggedFaqSectionId !== sectionId ||
      isReorderingFaqs
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetFaqId(faqId);
  }

  function handleFaqDragEnd(): void {
    setDraggedFaqId(null);
    setDraggedFaqSectionId(null);
    setDropTargetFaqId(null);
  }

  async function handleFaqDrop(sectionId: number, targetFaqId: number): Promise<void> {
    if (draggedFaqId === null || draggedFaqSectionId !== sectionId || isReorderingFaqs) {
      return;
    }

    const previousFaqs = faqs;
    const reorderedFaqs = reorderFaqsWithinSection(previousFaqs, sectionId, draggedFaqId, targetFaqId);
    setDraggedFaqId(null);
    setDraggedFaqSectionId(null);
    setDropTargetFaqId(null);

    if (reorderedFaqs === null) {
      return;
    }

    const sectionFaqIds = reorderedFaqs
      .filter((faq) => faq.faq_section_id === sectionId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((faq) => faq.id);

    setFaqs(reorderedFaqs);
    setNotice("");
    setError("");
    setIsReorderingFaqs(true);

    try {
      const savedFaqs = await api.reorderFaqs(sectionId, sectionFaqIds);
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
              <span className="admin-stat-label">Sections</span>
              <strong>{faqSections.length}</strong>
            </div>
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
            <h2>FAQ Sections</h2>
            <button className="button button-ghost" onClick={openNewSectionEditor} type="button">
              New section
            </button>
          </div>

          <div aria-busy={isReorderingSections} className="admin-list">
            {faqSections.map((section) => (
              <article
                className={`admin-list-item${draggedSectionId === section.id ? " dragging" : ""}${
                  dropTargetSectionId === section.id && draggedSectionId !== section.id
                    ? " drop-target"
                    : ""
                }`}
                key={section.id}
                onDragOver={(event) => handleSectionDragOver(event, section.id)}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleSectionDrop(section.id);
                }}
              >
                <div className="admin-item-top">
                  <div className="admin-item-heading">
                    <div className="admin-item-heading-main">
                      <h3>{section.name}</h3>
                      <button
                        aria-label={`Reorder ${section.name}`}
                        className="faq-drag-handle"
                        disabled={isReorderingSections}
                        draggable={!isReorderingSections}
                        onDragEnd={handleSectionDragEnd}
                        onDragStart={(event) => handleSectionDragStart(event, section.id)}
                        type="button"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                  <span className="pill">{faqCountsBySection.get(section.id) ?? 0} FAQs</span>
                </div>
                <div className="row-actions">
                  <button
                    className="button button-ghost"
                    onClick={() => openEditSectionEditor(section)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="button button-danger"
                    onClick={() => handleDeleteSection(section.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {faqSections.length === 0 ? <p className="empty-state">No FAQ sections yet.</p> : null}
          </div>
        </section>

        <section className="admin-panel admin-panel-faq admin-section">
          <div className="panel-heading">
            <h2>FAQs</h2>
            <button
              className="button button-ghost"
              disabled={faqSections.length === 0}
              onClick={openNewFaqEditor}
              type="button"
            >
              New FAQ
            </button>
          </div>

          {faqSections.length === 0 ? (
            <p className="empty-state">Create a FAQ section first.</p>
          ) : (
            <div aria-busy={isReorderingFaqs} className="admin-list">
              {faqSections.map((section) => {
                const sectionFaqs = faqs
                  .filter((faq) => faq.faq_section_id === section.id)
                  .sort((a, b) => a.sort_order - b.sort_order);

                return (
                  <section className="admin-faq-section" key={section.id}>
                    <div className="admin-faq-section-header">
                      <h3>{section.name}</h3>
                      <span className="admin-faq-section-count">{sectionFaqs.length}</span>
                    </div>
                    <div className="admin-faq-section-list">
                      {sectionFaqs.map((faq) => (
                        <article
                          className={`admin-list-item${draggedFaqId === faq.id ? " dragging" : ""}${
                            dropTargetFaqId === faq.id && draggedFaqId !== faq.id
                              ? " drop-target"
                              : ""
                          }`}
                          key={faq.id}
                          onDragOver={(event) => handleFaqDragOver(event, faq.id, section.id)}
                          onDrop={(event) => {
                            event.preventDefault();
                            void handleFaqDrop(section.id, faq.id);
                          }}
                        >
                          <div className="admin-item-top">
                            <div className="admin-item-heading">
                              <div className="admin-item-heading-main">
                                <h3>{faq.question}</h3>
                                <button
                                  aria-label={`Reorder ${faq.question}`}
                                  className="faq-drag-handle"
                                  disabled={isReorderingFaqs}
                                  draggable={!isReorderingFaqs}
                                  onDragEnd={handleFaqDragEnd}
                                  onDragStart={(event) =>
                                    handleFaqDragStart(event, faq.id, faq.faq_section_id)
                                  }
                                  type="button"
                                >
                                  Reorder
                                </button>
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
                      {sectionFaqs.length === 0 ? (
                        <div className="admin-faq-empty-dropzone">No FAQs in this section.</div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
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
                      {formatPublishedDate(post.published_at)}
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

      {isSectionDialogOpen ? (
        <div className="admin-dialog-backdrop" onClick={closeSectionEditor} role="presentation">
          <div
            aria-labelledby="section-dialog-title"
            aria-modal="true"
            className="admin-dialog"
            onClick={handleDialogClick}
            role="dialog"
          >
            <form className="editor-form admin-editor" onSubmit={handleSectionSubmit}>
              <div className="admin-dialog-header">
                <h3 id="section-dialog-title">{editingSectionId ? "Edit section" : "New section"}</h3>
                <button className="button button-ghost" onClick={closeSectionEditor} type="button">
                  Close
                </button>
              </div>
              <label>
                Name
                <input
                  onChange={(event) =>
                    setSectionForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  type="text"
                  value={sectionForm.name}
                />
              </label>
              <div className="admin-dialog-actions">
                <button className="button button-ghost" onClick={closeSectionEditor} type="button">
                  Cancel
                </button>
                <button className="button button-primary" type="submit">
                  {editingSectionId ? "Update section" : "Create section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
                Section
                <select
                  onChange={(event) =>
                    setFaqForm((current) => ({
                      ...current,
                      faq_section_id: Number(event.target.value),
                    }))
                  }
                  required
                  value={faqForm.faq_section_id || ""}
                >
                  <option disabled value="">
                    Choose a section
                  </option>
                  {faqSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </label>
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
