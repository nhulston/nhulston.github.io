import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

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

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  const description = post
    ? truncateText(toPlainText(post.summary || post.body_markdown), 180)
    : "Read Park City travel advice and lodging insights from The Lodge at Mountain Village.";

  const postJsonLd = useMemo(() => {
    if (!post) {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Park City Blog",
        url: `${SITE_URL}/blog${slug ? `/${slug}` : ""}`,
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      articleSection: "Park City Travel",
      author: post.author.trim()
        ? {
            "@type": "Person",
            name: post.author.trim(),
          }
        : undefined,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    };
  }, [description, post, slug]);

  usePageSeo({
    title: post ? `${post.title} | ParkCitySkiOut Blog` : "Park City Blog Post | ParkCitySkiOut",
    description,
    path: post ? `/blog/${post.slug}` : slug ? `/blog/${slug}` : "/blog",
    ogType: "article",
    imageAlt: post ? post.title : "Park City blog post from The Lodge at Mountain Village",
    jsonLd: postJsonLd,
    extraMeta: post
      ? [
          {
            property: "article:published_time",
            content: post.published_at,
          },
          {
            property: "article:modified_time",
            content: post.updated_at,
          },
          ...(post.author.trim()
            ? [
                {
                  property: "article:author",
                  content: post.author.trim(),
                },
              ]
            : []),
        ]
      : [],
  });

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
