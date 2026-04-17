import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type { FAQItem, LoadStatus } from "../types";

export function FaqPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    api
      .getPublicFaqs()
      .then((data) => {
        if (ignore) {
          return;
        }
        setFaqs(data);
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
        <p className="eyebrow">FAQ</p>
        <h1>Answers for booking, arrival, and the stay itself.</h1>
      </section>

      {status === "loading" ? <p className="empty-state">Loading FAQ...</p> : null}
      {status === "error" ? <p className="empty-state">{error}</p> : null}
      {status === "ready" && faqs.length === 0 ? (
        <p className="empty-state">No published FAQs yet.</p>
      ) : null}

      <div className="faq-list">
        {faqs.map((faq) => (
          <details className="faq-item" key={faq.id}>
            <summary>{faq.question}</summary>
            <div className="markdown-body">
              <ReactMarkdown>{faq.answer_markdown}</ReactMarkdown>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
