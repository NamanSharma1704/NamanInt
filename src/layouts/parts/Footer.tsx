import { Link } from 'react-router';
import { site } from 'virtual:content';
import BrandLogo from '@/components/BrandLogo';
import { MapPin, Mail, Phone, Globe } from 'lucide-react';

interface FooterOffice {
  label: string;
  address: string;
  phone?: string;
}

const offices: FooterOffice[] = [
  { label: 'Shenzhen Office', address: site.contact.addressEnglish, phone: site.contact.phone },
  {
    label: 'Hong Kong Office',
    address: site.contact.hongKongOffice.addressEnglish,
    phone: site.contact.hongKongOffice.phone,
  },
  { label: 'U.S.A. Office', address: site.contact.usaOffice.addressEnglish },
  { label: 'Manchester Office', address: site.contact.manchesterOffice.addressEnglish },
];

const navLinks = [
  { to: '/', label: 'Overview' },
  { to: '/trade-services', label: 'Trade Services' },
  { to: '/categories', label: 'Product Categories' },
  { to: '/company', label: 'Company Profile' },
  { to: '/contact', label: 'Contact & Trade Desk' },
];

/**
 * Site footer.
 *
 * Every route now closes on its own call to action, so the footer carries
 * none. It previously opened with a flat "Begin your trade conversation"
 * slab and held a second "Start an inquiry" button in a Partnership column,
 * which stacked three consecutive CTAs at the bottom of most pages — and on
 * /contact pointed back at the page the visitor was already on.
 *
 * The surface is the muted grey, one step below the page background, so the
 * light closing bands of the pages meet it at a hairline rather than blending in.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted text-foreground">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-12 border-b border-border pb-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <BrandLogo variant="light" />
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">{site.footer.summary}</p>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe size={12} className="shrink-0 text-accent-on-tint" />
              <span>Shenzhen · Hong Kong · California · Manchester</span>
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore</p>
            <nav aria-label="Footer navigation" className="mt-5 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="w-fit text-sm text-muted-foreground transition-colors duration-200 hover:text-accent-on-tint"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Offices as a compact 2x2 directory. Phone and email are plain
              tel:/mailto: links; the email previously came from a hardcoded
              string in one place and site.contact.email in others. */}
          <div className="lg:col-span-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Offices</p>
            <div className="mt-5 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {offices.map((office) => (
                <address key={office.label} className="border-t border-border pt-4 not-italic">
                  <p className="text-sm font-semibold text-foreground">{office.label}</p>
                  <p className="mt-2 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                    <MapPin size={12} className="mt-1 shrink-0 text-accent-on-tint" />
                    <span>{office.address}</span>
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {office.phone && (
                      <a
                        href={`tel:${office.phone}`}
                        className="flex w-fit items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-accent-on-tint"
                      >
                        <Phone size={12} className="shrink-0 text-accent-on-tint" />
                        <span>{office.phone}</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="flex w-fit items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-accent-on-tint"
                    >
                      <Mail size={12} className="shrink-0 text-accent-on-tint" />
                      <span>{site.contact.email}</span>
                    </a>
                  </div>
                </address>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} NAMAN INTERNATIONAL LTD. All rights reserved.</p>
          <p>{site.footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
