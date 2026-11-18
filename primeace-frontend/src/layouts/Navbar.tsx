import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export interface INavbarItem {
  label: string;
  href: string;
}

interface INavbarProps {
  brandName: string;
  brandAccent?: string;
  navigationItems: INavbarItem[];
  ctaLabel?: string;
  ctaHref?: string;
  homeHref?: string;
}

function Navbar({
  brandName,
  brandAccent,
  navigationItems,
  ctaLabel = "Get Started",
  ctaHref = "#contact",
  homeHref = "/"
}: INavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  const isActive = (href: string) => {
  const itemPath = href.split(/[?#]/)[0] ?? "";

    if (itemPath === "/") {
        return location.pathname === "/";
    }

    return (
        location.pathname === itemPath ||
        location.pathname.startsWith(`${itemPath}/`)
        );
    };

  const navigationColor = isScrolled
    ? "text-slate-600 hover:text-[#1556D6]"
    : "text-white/80 hover:text-white";

  const underlineColor = isScrolled
    ? "bg-[#1556D6]"
    : "bg-blue-400";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-70 transition-all duration-300 ${
        isScrolled
          ? "border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link
          to={homeHref}
          onClick={closeMenu}
          className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${
            isScrolled ? "text-[#0A1F44]" : "text-white"
          }`}
          aria-label={`${brandName} home`}
        >
          {brandName}
          {brandAccent && (
            <span className="text-[#1556D6]">{brandAccent}</span>
          )}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-9 md:flex"
        >
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative py-2 text-sm font-medium transition-colors duration-300 ${
                  active
                    ? isScrolled
                      ? "text-[#1556D6]"
                      : "text-white"
                    : navigationColor
                }`}
              >
                {item.label}

                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full transition-transform duration-300 ease-out ${
                    active
                      ? `scale-x-100 ${underlineColor}`
                      : `scale-x-0 ${underlineColor} group-hover:scale-x-100 group-focus-visible:scale-x-100`
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <Link
          to={ctaHref}
          className="hidden rounded-lg bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#0A1F44] md:inline-flex"
        >
          {ctaLabel}
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((previous) => !previous)}
          className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-300 md:hidden ${
            isScrolled
              ? "text-[#0A1F44] hover:bg-slate-100"
              : "text-white hover:bg-white/10"
          }`}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-slate-200 bg-white px-6 py-5 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navigationItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg border-l-2 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "border-[#1556D6] bg-blue-50 text-[#1556D6]"
                      : "border-transparent text-slate-700 hover:border-blue-300 hover:bg-slate-50 hover:text-[#1556D6]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              to={ctaHref}
              onClick={closeMenu}
              className="mt-2 inline-flex w-fit rounded-lg bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#0A1F44]"
            >
              {ctaLabel}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
