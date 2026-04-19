import { useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/faq", label: "FAQ" },
  { to: "/blog", label: "Blog" },
];

export function SiteLayout() {
  const navbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const navbarElement = navbarRef.current;
    if (navbarElement === null) {
      return undefined;
    }

    document.body.classList.add("public-site");

    let lastScrollTop = 0;
    const navbarHeight = 70;

    function handleScroll() {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDiff = currentScroll - lastScrollTop;
      const currentTransform =
        Number.parseInt(
          navbarElement!.style.transform.replace("translateY(", "").replace("px)", ""),
          10,
        ) || 0;

      if (currentScroll > lastScrollTop && currentScroll > 10) {
        const nextTransform = Math.max(-navbarHeight, currentTransform - scrollDiff);
        navbarElement!.style.transform = `translateY(${nextTransform}px)`;
      } else if (currentScroll < lastScrollTop) {
        const nextTransform = Math.min(0, currentTransform - scrollDiff);
        navbarElement!.style.transform = `translateY(${nextTransform}px)`;
      }

      if (currentScroll <= 0) {
        navbarElement!.style.transform = "translateY(0)";
      }

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }

    window.addEventListener("scroll", handleScroll, false);

    return () => {
      document.body.classList.remove("public-site");
      window.removeEventListener("scroll", handleScroll, false);
    };
  }, []);

  return (
    <div className="site-shell">
      <nav id="navbar" ref={navbarRef}>
        <div className="nav-content">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
              end={item.to === "/"}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="site-main">
        <Outlet />
      </main>

      <footer id="footer">
        <div className="row2">
          <div className="column2">
            <p>Copyright © 2026 | The Lodge at Park City</p>
          </div>
          <div className="column2">
            <p>
              <a href="mailto:Lodgeatmountainvillage@gmail.com">
                LODGEATMOUNTAINVILLAGE@GMAIL.COM
              </a>
              <br />
              (480) 945-1952
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
