import { useEffect } from "react";

export const SITE_URL = "https://parkcityskiout.com";
export const SITE_NAME = "ParkCitySkiOut";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

interface SeoMetaTag {
  content: string;
  name?: string;
  property?: string;
}

interface SeoConfig {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
  imagePath?: string;
  jsonLd?: JsonLdValue | null;
  noindex?: boolean;
  ogType?: "article" | "website";
  extraMeta?: SeoMetaTag[];
}

function buildAbsoluteUrl(path: string): string {
  if (!path || path === "/") {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (element === null) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function upsertCanonical(href: string): void {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (element === null) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }

  element.href = href;
}

function upsertJsonLd(jsonLd: JsonLdValue | null | undefined): void {
  const elementId = "seo-structured-data";
  const existing = document.getElementById(elementId);

  if (!jsonLd) {
    existing?.remove();
    return;
  }

  const script =
    existing instanceof HTMLScriptElement ? existing : document.createElement("script");

  script.id = elementId;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(jsonLd);

  if (existing === null) {
    document.head.appendChild(script);
  }
}

function replaceManagedExtraMeta(extraMeta: SeoMetaTag[]): void {
  document.head.querySelectorAll('meta[data-seo-extra="true"]').forEach((element) => element.remove());

  extraMeta.forEach((entry) => {
    const element = document.createElement("meta");
    if (entry.name) {
      element.name = entry.name;
    }
    if (entry.property) {
      element.setAttribute("property", entry.property);
    }
    element.content = entry.content;
    element.dataset.seoExtra = "true";
    document.head.appendChild(element);
  });
}

export function toPlainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function usePageSeo({
  title,
  description,
  path,
  imageAlt,
  imagePath = "/images/park-city-ski-resort.webp",
  jsonLd,
  noindex = false,
  ogType = "website",
  extraMeta = [],
}: SeoConfig): void {
  const canonicalUrl = buildAbsoluteUrl(path);
  const socialImageUrl = buildAbsoluteUrl(imagePath);
  const robots = noindex ? "noindex, nofollow, noarchive" : DEFAULT_ROBOTS;
  const serializedJsonLd = JSON.stringify(jsonLd ?? null);
  const serializedExtraMeta = JSON.stringify(extraMeta);

  useEffect(() => {
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", socialImageUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", socialImageUrl);
    if (imageAlt) {
      upsertMeta("name", "twitter:image:alt", imageAlt);
    }
    upsertCanonical(canonicalUrl);
    upsertJsonLd(serializedJsonLd === "null" ? null : (JSON.parse(serializedJsonLd) as JsonLdValue));
    replaceManagedExtraMeta(JSON.parse(serializedExtraMeta) as SeoMetaTag[]);
  }, [
    canonicalUrl,
    description,
    imageAlt,
    ogType,
    robots,
    serializedExtraMeta,
    serializedJsonLd,
    socialImageUrl,
    title,
  ]);
}
