import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

export function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    api
      .getPublicBlogPosts()
      .then((data) => {
        if (ignore) {
          return;
        }
        setPosts(data);
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
  }, []);

  return (
    <div className="page-content">
      <h1 className="page-title">Our Blog</h1>

      {status === "loading" ? (
        <div className="page-status">
          <p>Loading posts...</p>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="page-status error">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="blog-list">
        {status === "ready" && posts.length === 0 ? (
          <div className="page-status">
            <p>No published blog posts yet.</p>
          </div>
        ) : null}

        {posts.map((post) => (
          <article className="blog-card" key={post.id}>
            <h2 className="blog-title">
              <Link to={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="blog-date">{formatByline(post.published_at, post.author)}</p>
            <p className="blog-excerpt">{post.summary}</p>
            <Link className="read-more" to={`/blog/${post.slug}`}>
              Read More -&gt;
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
