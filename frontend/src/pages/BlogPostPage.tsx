import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type { BlogPost, LoadStatus } from "../types";

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      return undefined;
    }

    let ignore = false;

    api
      .getPublicBlogPost(slug)
      .then((data) => {
        if (ignore) {
          return;
        }
        setPost(data);
        setStatus("ready");
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setError(getErrorMessage(requestError));
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <div className="page-stack page-shell">
      {status === "loading" ? <p className="empty-state">Loading post...</p> : null}
      {status === "error" ? (
        <div className="content-card">
          <p className="empty-state">{error}</p>
          <Link className="text-link" to="/blog">
            Back to blog
          </Link>
        </div>
      ) : null}
      {status === "ready" && post ? (
        <article className="article-card">
          <p className="eyebrow">Blog</p>
          <h1>{post.title}</h1>
          <p className="article-meta">
            {new Date(post.published_at || post.created_at).toLocaleDateString()}
          </p>
          <p className="article-summary">{post.summary}</p>
          <div className="markdown-body">
            <ReactMarkdown>{post.body_markdown}</ReactMarkdown>
          </div>
          <Link className="text-link" to="/blog">
            Back to all posts
          </Link>
        </article>
      ) : null}
    </div>
  );
}
