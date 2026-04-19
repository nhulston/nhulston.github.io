import { Link, useLocation } from "react-router-dom";

import { usePageSeo } from "../lib/seo";

export function NotFoundPage() {
  const location = useLocation();

  usePageSeo({
    title: "Page Not Found | ParkCitySkiOut",
    description: "The requested page could not be found on ParkCitySkiOut.",
    path: location.pathname,
    noindex: true,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Page Not Found",
      url: `https://parkcityskiout.com${location.pathname}`,
    },
  });

  return (
    <div className="page-content">
      <h1 className="page-title">Page Not Found</h1>
      <div className="page-status error">
        <p>That page does not exist.</p>
      </div>
      <div className="blog-navigation">
        <Link className="back-to-blog" to="/">
          &lt;- Back Home
        </Link>
      </div>
    </div>
  );
}
