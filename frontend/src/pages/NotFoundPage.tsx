import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page-shell page-stack">
      <section className="content-card">
        <p className="eyebrow">404</p>
        <h1>That page does not exist.</h1>
        <Link className="text-link" to="/">
          Return to the homepage
        </Link>
      </section>
    </div>
  );
}
