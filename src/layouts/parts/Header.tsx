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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#050E1A]/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.35)]'
          : 'border-b border-white/8 bg-[#050E1A] backdrop-blur-md'
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-14">
        <div className="flex h-[72px] items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="shrink-0" aria-label="NAMAN INTERNATIONAL LTD home">
            <BrandLogo variant="dark" />
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
                      ? 'text-white bg-white/10 font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_hsl(179_80%_60%/0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Global offices indicator (desktop only) */}
            <div className="hidden items-center gap-2 xl:flex text-white/40">
              <Globe size={13} className="text-accent" />
              <span className="text-[11px] font-medium tracking-wider">SZ · HK · CA · UK</span>
            </div>

            <div className="h-4 w-px hidden xl:block bg-white/15" />

            {/* CTA */}
            <Link
              to="/contact"
              className="hidden items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-white shadow-sm transition-all duration-200 hover:bg-accent/85 hover:shadow-[0_0_24px_hsl(179_80%_40%/0.4)] md:inline-flex"
            >
              Make an inquiry
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-white transition-colors hover:bg-white/10 lg:hidden"
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
            className="border-t border-white/10 bg-[#050E1A]/98 pb-6 pt-4 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-accent/15 text-accent font-semibold' : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-accent" />}
                  </Link>
                );
              })}
              <div className="mt-4 border-t border-white/10 pt-4">
                <Link
                  to="/contact"
                  className="flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_hsl(179_80%_40%/0.3)]"
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
