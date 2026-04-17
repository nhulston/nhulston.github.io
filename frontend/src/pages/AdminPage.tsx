import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

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

function createEmptyBlogForm(): BlogPostFormData {
  return {
    title: "",
    summary: "",
    slug: "",
    body_markdown: "",
    published: true,
  };
}

function createEmptyFaqForm(): FAQFormData {
  return {
    question: "",
    answer_markdown: "",
    sort_order: 0,
    published: true,
  };
}

export function AdminPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [blogForm, setBlogForm] = useState<BlogPostFormData>(createEmptyBlogForm);
  const [faqForm, setFaqForm] = useState<FAQFormData>(createEmptyFaqForm);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const pageTitle = useMemo(
    () => (editingBlogId || editingFaqId ? "Edit content" : "Create content"),
    [editingBlogId, editingFaqId],
  );

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
    loadAll();
  }, []);

  async function handleBlogSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice("");
    setError("");

    const payload: BlogPostPayload = {
      ...blogForm,
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
      setBlogForm(createEmptyBlogForm());
      setEditingBlogId(null);
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
      setFaqForm(createEmptyFaqForm());
      setEditingFaqId(null);
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
        setEditingBlogId(null);
        setBlogForm(createEmptyBlogForm());
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
        setEditingFaqId(null);
        setFaqForm(createEmptyFaqForm());
      }
      await loadAll();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h1>Blog and FAQ CRUD</h1>
          <p className="admin-subtitle">
            Protected by nginx basic auth. The app itself only exposes content
            editing.
          </p>
        </div>
        <a className="button button-secondary" href="/">
          View site
        </a>
      </header>

      <div className="admin-alerts">
        {notice ? <p className="notice success">{notice}</p> : null}
        {error ? <p className="notice error">{error}</p> : null}
        {status === "loading" ? <p className="notice">Loading content...</p> : null}
      </div>

      <section className="admin-grid">
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Blog</p>
              <h2>Posts</h2>
            </div>
            <button
              className="button button-ghost"
              onClick={() => {
                setEditingBlogId(null);
                setBlogForm(createEmptyBlogForm());
              }}
              type="button"
            >
              New post
            </button>
          </div>
          <div className="admin-list">
            {blogPosts.map((post) => (
              <article className="admin-list-item" key={post.id}>
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.slug}</p>
                  <span className={`pill${post.published ? " live" : ""}`}>
                    {post.published ? "Published" : "Hidden"}
                  </span>
                </div>
                <div className="row-actions">
                  <button
                    className="button button-ghost"
                    onClick={() => {
                      setEditingBlogId(post.id);
                      setBlogForm({
                        title: post.title,
                        summary: post.summary,
                        slug: post.slug,
                        body_markdown: post.body_markdown,
                        published: post.published,
                      });
                    }}
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
            {blogPosts.length === 0 ? (
              <p className="empty-state">No blog posts yet.</p>
            ) : null}
          </div>
          <form className="editor-form" onSubmit={handleBlogSubmit}>
            <h3>{editingBlogId ? "Edit post" : "Create post"}</h3>
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
                rows={10}
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
            <button className="button button-primary" type="submit">
              {editingBlogId ? "Update post" : "Create post"}
            </button>
          </form>
        </div>

        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2>Questions</h2>
            </div>
            <button
              className="button button-ghost"
              onClick={() => {
                setEditingFaqId(null);
                setFaqForm(createEmptyFaqForm());
              }}
              type="button"
            >
              New FAQ
            </button>
          </div>
          <div className="admin-list">
            {faqs.map((faq) => (
              <article className="admin-list-item" key={faq.id}>
                <div>
                  <h3>{faq.question}</h3>
                  <p>Sort order: {faq.sort_order}</p>
                  <span className={`pill${faq.published ? " live" : ""}`}>
                    {faq.published ? "Published" : "Hidden"}
                  </span>
                </div>
                <div className="row-actions">
                  <button
                    className="button button-ghost"
                    onClick={() => {
                      setEditingFaqId(faq.id);
                      setFaqForm({
                        question: faq.question,
                        answer_markdown: faq.answer_markdown,
                        sort_order: faq.sort_order,
                        published: faq.published,
                      });
                    }}
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
          <form className="editor-form" onSubmit={handleFaqSubmit}>
            <h3>{editingFaqId ? "Edit FAQ" : "Create FAQ"}</h3>
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
                rows={8}
                value={faqForm.answer_markdown}
              />
            </label>
            <label>
              Sort order
              <input
                onChange={(event) =>
                  setFaqForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value),
                  }))
                }
                type="number"
                value={faqForm.sort_order}
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
            <button className="button button-primary" type="submit">
              {editingFaqId ? "Update FAQ" : "Create FAQ"}
            </button>
          </form>
        </div>
      </section>

      <p className="admin-footnote">{pageTitle}</p>
    </div>
  );
}
