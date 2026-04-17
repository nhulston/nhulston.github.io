import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type { BlogPost, FAQItem } from "../types";

const features = [
  "Next to 5 chairlifts",
  "Walkable restaurants, shops, and coffee",
  "Heated indoor and outdoor pool plus spas",
  "Washer and dryer inside the condo",
  "Underground parking and fitness center",
  "Ice skating rink in the complex",
];

const condos = [
  {
    name: "The Taylor",
    details: "Luxury 4 bedroom, 3 bath slopeside",
    sleeps: "Sleeps 13",
    image: "/images/park-city-condo3.jpg",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/the-taylor-rare-remodeled-park-city-ski-in-out-magnificent-4-br3ba-lux/241e53",
  },
  {
    name: "The Margot",
    details: "Rare 4 bedroom, 3 bath slopeside",
    sleeps: "Sleeps 13",
    image: "/images/park-city-condo1.jpg",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/just-remodeled-the-margot-rare-ski-in-ski-out-spacious-luxury-and-comfort/fbb760",
  },
  {
    name: "The Draper",
    details: "2 bedroom, 2 bath with a giant private porch",
    sleeps: "Sleeps 7",
    image: "/images/park-city-condo2.jpg",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/just-remodeled-the-draper-rare-ski-in-out-spacious-luxury-huge-porch-views/25af7f",
  },
  {
    name: "The Hamilton",
    details: "2 bedroom, 2 bath with ski mountain views",
    sleeps: "Sleeps 8",
    image: "/images/park-city-condo4.jpg",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/the-hamilton-rare-ski-in-out-incredible-views-pool-skating-rink-best-park-city-location-stunning/162c7f",
  },
];

export function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadContent() {
      try {
        const [blogPosts, faqItems] = await Promise.all([
          api.getPublicBlogPosts(),
          api.getPublicFaqs(),
        ]);
        if (ignore) {
          return;
        }
        setPosts(blogPosts.slice(0, 3));
        setFaqs(faqItems.slice(0, 4));
      } catch (error: unknown) {
        if (!ignore) {
          setContentError(getErrorMessage(error));
        }
      }
    }

    loadContent();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Slopeside stay in Park City</p>
          <h1>An unforgettable ski-in, ski-out basecamp.</h1>
          <p className="hero-text">
            Stay steps from the lifts, the rink, the pool, and the village.
            This is the easy version of Park City.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href="https://thelodgeatmountainvillage.bookeddirectly.com/"
              rel="noreferrer"
              target="_blank"
            >
              Book direct
            </a>
            <Link className="button button-secondary" to="/faq">
              Plan your stay
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <img
            alt="Park City ski resort"
            className="hero-image"
            src="/images/park-city-ski-resort.jpeg"
          />
          <div className="hero-badge">
            <span>Direct booking</span>
            <strong>The Lodge at Mountain Village</strong>
          </div>
        </div>
      </section>

      <section className="split-panel">
        <div className="panel-copy">
          <p className="eyebrow">Why this location works</p>
          <h2>Unbeatable access without the usual logistics headache.</h2>
          <ul className="feature-list">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="panel-image-card">
          <img
            alt="Map of Park City Mountain Resort"
            src="/images/park-city-map.jpeg"
          />
        </div>
      </section>

      <section className="section-heading">
        <p className="eyebrow">Choose your condo</p>
        <h2>Layouts for families, group trips, and long weekends.</h2>
      </section>

      <section className="condo-grid">
        {condos.map((condo) => (
          <article className="condo-card" key={condo.name}>
            <img alt={condo.name} src={condo.image} />
            <div className="condo-card-body">
              <p className="eyebrow">{condo.sleeps}</p>
              <h3>{condo.name}</h3>
              <p>{condo.details}</p>
              <a href={condo.href} rel="noreferrer" target="_blank">
                View condo
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="content-card">
          <div className="section-heading compact">
            <p className="eyebrow">Blog</p>
            <h2>Trip notes and local guidance</h2>
          </div>
          {contentError ? <p className="empty-state">{contentError}</p> : null}
          {posts.length === 0 && !contentError ? (
            <p className="empty-state">
              No blog posts are published yet. Add your first post in the admin
              dashboard.
            </p>
          ) : (
            <div className="stack-list">
              {posts.map((post) => (
                <article className="list-card" key={post.id}>
                  <p className="list-card-meta">{post.published ? "Published" : "Hidden"}</p>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <Link to={`/blog/${post.slug}`}>Read more</Link>
                </article>
              ))}
            </div>
          )}
          <Link className="text-link" to="/blog">
            Browse all posts
          </Link>
        </div>

        <div className="content-card">
          <div className="section-heading compact">
            <p className="eyebrow">FAQ</p>
            <h2>Quick answers before you book</h2>
          </div>
          {faqs.length === 0 && !contentError ? (
            <p className="empty-state">
              No FAQs are published yet. Add a few answers in the admin
              dashboard.
            </p>
          ) : (
            <div className="faq-preview-list">
              {faqs.map((faq) => (
                <article className="faq-preview-card" key={faq.id}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer_markdown.slice(0, 140)}...</p>
                </article>
              ))}
            </div>
          )}
          <Link className="text-link" to="/faq">
            View the full FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
