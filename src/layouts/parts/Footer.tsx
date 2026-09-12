import { Link } from 'react-router';
import { site } from 'virtual:content';
import BrandLogo from '@/components/BrandLogo';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { MapPin, Mail, Phone, Globe } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const companyEmail = 'sales@namanint.com';

  return (
    <footer className="mt-auto">
      {/* Top CTA Strip */}
      <div className="bg-accent">
        <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                Ready to source smarter?
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                Begin your trade conversation today.
              </p>
            </div>
            <Link
              to="/contact"
              className="shrink-0 rounded-lg border border-white/30 bg-black/10 px-6 py-3 text-sm font-semibold tracking-wide text-white backdrop-blur-sm transition-colors duration-200 hover:bg-black/20 hover:border-white/50"
            >
              Start an inquiry →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1440px] px-5 py-16 lg:px-10 lg:py-20">
          <div className="grid grid-cols-1 gap-12 border-b border-primary-foreground/10 pb-14 md:grid-cols-2 xl:grid-cols-6">

            {/* Brand Column */}
            <div className="xl:col-span-2">
              <BrandLogo variant="dark" />
              <p className="mt-6 max-w-sm text-sm leading-7 text-primary-foreground/60">
                {site.footer.summary}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-primary-foreground/70">
                <Globe size={12} />
                <span>Shenzhen · Hong Kong · California · Manchester</span>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary-foreground/70">
                Explore
              </p>
              <nav aria-label="Footer navigation" className="mt-5 flex flex-col gap-3">
                {[
                  { to: '/', label: 'Overview' },
                  { to: '/trade-services', label: 'Trade Services' },
                  { to: '/categories', label: 'Product Categories' },
                  { to: '/company', label: 'Company Profile' },
                  { to: '/contact', label: 'Contact & Trade Desk' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm text-primary-foreground/70 transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Shenzhen + HK Offices */}
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary-foreground/70">
                  Shenzhen Office
                </p>
                <address className="mt-4 not-italic">
                  <p className="flex items-start gap-2 text-xs leading-6 text-primary-foreground/65">
                    <MapPin size={12} className="mt-1 shrink-0 text-accent" />
                    {site.contact.addressEnglish}
                  </p>
                  <a
                    href={`tel:${site.contact.phone}`}
                    className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/65 transition-colors hover:text-accent"
                  >
                    <Phone size={12} className="text-accent" />
                    {site.contact.phone}
                  </a>
                  <Link001
                    href={`mailto:${companyEmail}`}
                    className="mt-2 flex items-center gap-2 text-xs text-primary-foreground/65 hover:text-accent"
                  >
                    <Mail size={12} className="text-accent" />
                    {companyEmail}
                  </Link001>
                </address>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary-foreground/70">
                  Hong Kong Office
                </p>
                <address className="mt-4 not-italic">
                  <p className="flex items-start gap-2 text-xs leading-6 text-primary-foreground/65">
                    <MapPin size={12} className="mt-1 shrink-0 text-accent" />
                    {site.contact.hongKongOffice.addressEnglish}
                  </p>
                  <a
                    href={`tel:${site.contact.hongKongOffice.phone}`}
                    className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/65 transition-colors hover:text-accent"
                  >
                    <Phone size={12} className="text-accent" />
                    {site.contact.hongKongOffice.phone}
                  </a>
                </address>
              </div>
            </div>

            {/* USA + Manchester Offices */}
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary-foreground/70">
                  U.S.A. Office
                </p>
                <address className="mt-4 not-italic">
                  <p className="flex items-start gap-2 text-xs leading-6 text-primary-foreground/65">
                    <MapPin size={12} className="mt-1 shrink-0 text-accent" />
                    {site.contact.usaOffice.addressEnglish}
                  </p>
                  <Link001
                    href={`mailto:${site.contact.email}`}
                    className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/65 hover:text-accent"
                  >
                    <Mail size={12} className="text-accent" />
                    {site.contact.email}
                  </Link001>
                </address>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary-foreground/70">
                  Manchester Office
                </p>
                <address className="mt-4 not-italic">
                  <p className="flex items-start gap-2 text-xs leading-6 text-primary-foreground/65">
                    <MapPin size={12} className="mt-1 shrink-0 text-accent" />
                    {site.contact.manchesterOffice.addressEnglish}
                  </p>
                  <Link001
                    href={`mailto:${site.contact.email}`}
                    className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/65 hover:text-accent"
                  >
                    <Mail size={12} className="text-accent" />
                    {site.contact.email}
                  </Link001>
                </address>
              </div>
            </div>

            {/* Partnership Column */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary-foreground/70">
                Partnership
              </p>
              <p className="mt-5 text-sm leading-7 text-primary-foreground/60">
                For new supply conversations and trade enquiries, begin with a direct introduction.
              </p>
              <div className="mt-6">
                <Link001
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition-all duration-200 hover:bg-accent/90"
                >
                  Start an inquiry →
                </Link001>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col gap-3 pt-8 text-xs text-primary-foreground/70 md:flex-row md:items-center md:justify-between">
            <p>© {currentYear} NAMAN INTERNATIONAL LTD. All rights reserved.</p>
            <p className="text-primary-foreground/60">{site.footer.tagline}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}