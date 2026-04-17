import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type { BlogPost, LoadStatus } from "../types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function formatByline(value: string, author: string): string {
  const formattedDate = formatDate(value);
  return author.trim() ? `${formattedDate} • By ${author.trim()}` : formattedDate;
}

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
    <div className="page-content">
      {status === "loading" ? (
        <div className="page-status">
          <p>Loading post...</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="page-status error">
          <p>{error}</p>
          <div className="blog-navigation">
            <Link className="back-to-blog" to="/blog">
              &lt;- Back to Blog
            </Link>
          </div>
        </div>
      ) : null}

      {status === "ready" && post ? (
        <article className="blog-post">
          <h1 className="page-title">{post.title}</h1>
          <p className="blog-date">{formatByline(post.published_at, post.author)}</p>

          <div className="blog-content">
            {post.summary ? <p>{post.summary}</p> : null}
            <ReactMarkdown>{post.body_markdown}</ReactMarkdown>
          </div>

          <div className="blog-navigation">
            <Link className="back-to-blog" to="/blog">
              &lt;- Back to Blog
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  );
}
