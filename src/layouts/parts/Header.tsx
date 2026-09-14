import { Link, useLocation } from 'react-router';
import { Menu, X, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import BrandLogo from '@/components/BrandLogo';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/trade-services', label: 'Trade Services' },
  { href: '/categories', label: 'Categories' },
  { href: '/company', label: 'Company' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border transition-all duration-300 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-xl shadow-[0_8px_30px_hsl(213_30%_10%/0.08)]'
          : 'bg-background backdrop-blur-md'
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-14">
        <div className="flex h-[72px] items-center justify-between gap-6">

          {/* Logo: the navy and gold artwork as drawn, on the light header. */}
          <Link to="/" className="shrink-0" aria-label="NAMAN INTERNATIONAL LTD home">
            <BrandLogo variant="light" />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`relative rounded-lg px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-all duration-200 ${
                    isActive
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-accent-on-tint" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Global offices indicator (desktop only) */}
            <div className="hidden items-center gap-2 text-muted-foreground xl:flex">
              <Globe size={13} className="text-accent-on-tint" />
              <span className="text-[11px] font-medium tracking-wider">SZ · HK · CA · UK</span>
            </div>

            <div className="hidden h-4 w-px bg-border xl:block" />

            {/* CTA: gold fill with navy text and a soft gold shadow; white on this gold measures only 2.4:1. */}
            <Link
              to="/contact"
              className="hidden items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-accent-foreground shadow-teal transition-all duration-200 hover:bg-accent-hover hover:shadow-teal-lg md:inline-flex"
            >
              Make an inquiry
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-lg border border-border p-2.5 text-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-border bg-background/98 pb-6 pt-4 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-accent/10 font-semibold text-accent-on-tint' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-accent-on-tint" />}
                  </Link>
                );
              })}
              <div className="mt-4 border-t border-border pt-4">
                <Link
                  to="/contact"
                  className="flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground shadow-teal"
                >
                  Make an inquiry
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
