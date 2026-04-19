import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { truncateText, toPlainText, usePageSeo } from "../lib/seo";
import type { FAQPublicSection, LoadStatus } from "../types";

export function FaqPage() {
  const [faqSections, setFaqSections] = useState<FAQPublicSection[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  const faqJsonLd = useMemo(() => {
    if (faqSections.length === 0) {
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [],
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqSections.flatMap((section) =>
        section.items.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: truncateText(toPlainText(faq.answer_markdown), 5000),
          },
        })),
      ),
    };
  }, [faqSections]);

  usePageSeo({
    title: "Park City Ski Condo FAQ | Parking, Check-In, Amenities",
    description:
      "Read Park City condo FAQs covering parking, check-in, luggage storage, condo policies, amenities, and local stay details at The Lodge at Mountain Village.",
    path: "/faq",
    imageAlt: "Frequently asked questions about staying at The Lodge at Mountain Village in Park City",
    jsonLd: faqJsonLd,
  });

  useEffect(() => {
    let ignore = false;

    api
      .getPublicFaqs()
      .then((data) => {
        if (ignore) {
          return;
        }
        setFaqSections(data);
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
      <h1 className="page-title">Frequently Asked Questions</h1>

      <div className="faq-container">
        {status === "loading" ? (
          <div className="page-status">
            <p>Loading FAQ...</p>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="page-status error">
            <p>{error}</p>
          </div>
        ) : null}
        {status === "ready" && faqSections.length === 0 ? (
          <div className="page-status">
            <p>No published FAQs yet.</p>
          </div>
        ) : null}

        {faqSections.map((section) => (
          <section className="faq-section-group" key={section.id}>
            <h2 className="faq-section-title">{section.name}</h2>
            {section.items.map((faq) => (
              <div className="faq-item" key={faq.id}>
                <h3 className="faq-question">{faq.question}</h3>
                <div className="faq-answer">
                  <ReactMarkdown>{faq.answer_markdown}</ReactMarkdown>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="contact-section">
        <h2>Have more questions?</h2>
        <p>
          Contact us at{" "}
          <a href="mailto:Lodgeatmountainvillage@gmail.com">
            LODGEATMOUNTAINVILLAGE@GMAIL.COM
          </a>{" "}
          or call <strong>(480) 945-1952</strong>
        </p>
      </div>
    </div>
  );
}
