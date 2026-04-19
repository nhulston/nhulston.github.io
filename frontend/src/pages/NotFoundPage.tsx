import { Link } from "react-router-dom";

export function NotFoundPage() {
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
