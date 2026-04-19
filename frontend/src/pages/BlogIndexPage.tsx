import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { SITE_NAME, SITE_URL, truncateText, toPlainText, usePageSeo } from "../lib/seo";
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

  const blogJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "ParkCitySkiOut Blog",
      url: `${SITE_URL}/blog`,
      description:
        "Guides and trip notes for choosing where to stay, planning a Park City ski trip, and getting the most from a slopeside condo stay.",
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: `${SITE_URL}/blog/${post.slug}`,
        description: truncateText(toPlainText(post.summary || post.body_markdown), 200),
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: post.author.trim()
          ? {
              "@type": "Person",
              name: post.author.trim(),
            }
          : undefined,
      })),
    }),
    [posts],
  );

  usePageSeo({
    title: "Park City Blog | Guides, Trip Notes, and Condo Advice",
    description:
      "Browse Park City travel guides, ski trip planning advice, and local lodging tips from The Lodge at Mountain Village blog.",
    path: "/blog",
    imageAlt: "Park City travel blog from The Lodge at Mountain Village",
    jsonLd: blogJsonLd,
  });

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
