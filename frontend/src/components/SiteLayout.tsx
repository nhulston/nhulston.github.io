import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Stay" },
  { to: "/blog", label: "Blog" },
  { to: "/faq", label: "FAQ" },
];

export function SiteLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <p className="eyebrow">The Lodge at Park City</p>
          <NavLink className="brand-title" to="/">
            Ski-in. Ski-out. Stay close to everything.
          </NavLink>
        </div>
        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `site-nav-link${isActive ? " active" : ""}`
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <a
            className="site-nav-cta"
            href="https://thelodgeatmountainvillage.bookeddirectly.com/"
            rel="noreferrer"
            target="_blank"
          >
            Book Now
          </a>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <p className="footer-title">Book Direct</p>
          <p>Best location, fast lift access, and room for the whole crew.</p>
        </div>
        <div>
          <p className="footer-title">Contact</p>
          <p>
            <a href="mailto:Lodgeatmountainvillage@gmail.com">
              lodgeatmountainvillage@gmail.com
            </a>
          </p>
          <p>(480) 945-1952</p>
        </div>
        <div>
          <p className="footer-title">Follow</p>
          <p>
            <a
              href="https://www.facebook.com/The-Lodge-at-Park-City-Mountain-Resort-105341847843419/"
              rel="noreferrer"
              target="_blank"
            >
              Facebook
            </a>
          </p>
          <p>
            <a href="/admin">Admin</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
