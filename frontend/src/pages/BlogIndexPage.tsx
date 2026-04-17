import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type { BlogPost, LoadStatus } from "../types";

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
    <div className="page-stack page-shell">
      <section className="page-intro">
        <p className="eyebrow">Blog</p>
        <h1>Local tips, trip planning notes, and property updates.</h1>
      </section>

      {status === "loading" ? <p className="empty-state">Loading posts...</p> : null}
      {status === "error" ? <p className="empty-state">{error}</p> : null}
      {status === "ready" && posts.length === 0 ? (
        <p className="empty-state">No published blog posts yet.</p>
      ) : null}

      <section className="blog-grid">
        {posts.map((post) => (
          <article className="blog-card" key={post.id}>
            <p className="list-card-meta">
              {new Date(post.published_at || post.created_at).toLocaleDateString()}
            </p>
            <h2>{post.title}</h2>
            <p>{post.summary}</p>
            <Link to={`/blog/${post.slug}`}>Read post</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
