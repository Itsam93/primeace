import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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

  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();

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
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-[70] border-b transition-all duration-300 ${
        isScrolled
          ? "border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Brand */}
        <Link
          to={homeHref}
          onClick={closeMenu}
          className={`text-2xl font-bold tracking-tight transition-colors ${
            isScrolled ? "text-[#07152F]" : "text-white"
          }`}
        >
          {brandName}
          {brandAccent && (
            <span className="text-[#1556D6]">{brandAccent}</span>
          )}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`group relative py-2 text-sm font-medium transition-colors ${
                  active
                    ? isScrolled
                      ? "text-[#1556D6]"
                      : "text-white"
                    : navigationColor
                }`}
              >
                {item.label}

                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left transition-transform duration-300 ${
                    active
                      ? `scale-x-100 ${underlineColor}`
                      : `scale-x-0 group-hover:scale-x-100 ${underlineColor}`
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <Link
          to={ctaHref}
          className="hidden items-center justify-center rounded-lg bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 md:inline-flex"
        >
          {ctaLabel}
        </Link>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((previous) => !previous)}
          aria-label={
            isMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors md:hidden ${
            isScrolled
              ? "text-[#07152F] hover:bg-slate-100"
              : "text-white hover:bg-white/10"
          }`}
        >
          <span className="relative flex h-5 w-6 items-center justify-center">
            {/* Top bar */}
            <span
              className={`absolute h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
                isMenuOpen
                  ? "translate-y-0 rotate-45"
                  : "-translate-y-2 rotate-0"
              }`}
            />

            {/* Middle bar */}
            <span
              className={`absolute h-0.5 w-6 rounded-full bg-current transition-all duration-200 ease-in-out ${
                isMenuOpen
                  ? "scale-x-0 opacity-0"
                  : "scale-x-100 opacity-100"
              }`}
            />

            {/* Bottom bar */}
            <span
              className={`absolute h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
                isMenuOpen
                  ? "translate-y-0 -rotate-45"
                  : "translate-y-2 rotate-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Animated mobile navigation */}
      <div
        id="mobile-navigation"
        aria-hidden={!isMenuOpen}
        className={`overflow-hidden border-t border-slate-200 bg-white shadow-lg transition-[max-height,opacity,transform] duration-300 ease-in-out motion-reduce:transition-none md:hidden ${
          isMenuOpen
            ? "max-h-[calc(100dvh-5rem)] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        }`}
      >
        <nav className="max-h-[calc(100dvh-5rem)] space-y-1 overflow-y-auto px-6 py-5">
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                tabIndex={isMenuOpen ? 0 : -1}
                onClick={closeMenu}
                className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-[#1556D6]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#1556D6]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            to={ctaHref}
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
            className="mt-3 flex items-center justify-center rounded-lg bg-[#1556D6] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
