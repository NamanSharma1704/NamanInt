import type { CSSProperties } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import { ArrowRight, Anchor, Clock, Factory, Globe, Plane, ShieldCheck, Ship, Users } from 'lucide-react';
import { Link } from 'react-router';
import { home } from 'virtual:content';
import AudienceSegmenter from '../components/AudienceSegmenter';
import ServicesSequence from '@/components/ServicesSequence';
import { InteractiveHoverLink } from '@/components/ui/interactive-hover-button';
import { LogoSlider } from '@/components/ui/logo-slider';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';
import { Reveal } from '@/components/ui/reveal';
import TradeRouteExplorer from '@/components/trade-network/TradeRouteExplorer';

const title = 'International Trade Partner | NAMAN INTERNATIONAL LTD';
const description = 'NAMAN INTERNATIONAL LTD supports North American retailers and wholesale buyers with considered international trade coordination.';
const buildJsonLd = (siteUrl: string, pageUrl: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'NAMAN INTERNATIONAL LTD', url: pageUrl },
    { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'NAMAN INTERNATIONAL LTD', url: pageUrl, description },
    { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, name: title, url: pageUrl, isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': `${siteUrl}/#organization` }, datePublished: '2026-09-05', dateModified: '2026-09-05' },
  ],
});

/** Staggers the hero's CSS entrance (`.hero-rise` in globals.css). */
const heroDelay = (seconds: number): CSSProperties => ({ '--hero-delay': `${seconds}s` }) as CSSProperties;

const carrierLogos = [
  <div key="maersk" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Ship size={13} aria-hidden="true" className="text-accent-on-tint" /><span>Maersk Line</span></div>,
  <div key="hapag" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Anchor size={13} aria-hidden="true" className="text-accent-on-tint" /><span>Hapag-Lloyd</span></div>,
  <div key="msc" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Ship size={13} aria-hidden="true" className="text-accent-on-tint" /><span>MSC Mediterranean</span></div>,
  <div key="cosco" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Ship size={13} aria-hidden="true" className="text-accent-on-tint" /><span>COSCO Shipping</span></div>,
  <div key="cma" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Anchor size={13} aria-hidden="true" className="text-accent-on-tint" /><span>CMA CGM Group</span></div>,
  <div key="iata" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Plane size={13} aria-hidden="true" className="text-accent-on-tint" /><span>IATA Cargo Reg</span></div>,
];

/** The four headline metrics. Declared once — they previously appeared both in
 *  the hero and again above the footer, which is duplication, not emphasis. */
const metrics = [
  { value: <AnimeCounter value={18} suffix="+" duration={1800} />, label: 'Years in Pacific trade' },
  // A ceiling does not count up: every figure on the way would claim a better rate than the target.
  { value: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} countUp={false} />, label: 'Target defect rate' },
  { value: <AnimeCounter value={100} suffix="%" duration={2000} />, label: 'Pre-shipment SLA' },
  { value: <AnimeCounter value={4} duration={1400} />, label: 'Global operating hubs' },
];

/** Three facts a buyer checks first, set under the hero actions. Each is stated elsewhere on the site. */
const heroAssurances = [
  { icon: ShieldCheck, label: 'ANSI/ASQ Z1.4 inspections' },
  { icon: Factory, label: '180+ audited factories' },
  { icon: Globe, label: 'Desks on three continents' },
];

/** Photograph per service row, keyed by the content file's `image` token. */
const serviceImages: Record<string, { src: string; alt: string }> = {
  materials: { src: '/assets/images/sourcing-direction.jpg', alt: 'Trade sourcing specialists reviewing product samples' },
  warehouse: { src: '/assets/images/supplier-coordination.jpg', alt: 'Supplier coordination on the factory floor' },
  detail: { src: '/assets/images/quality-inspection.jpg', alt: 'Pre-shipment quality inspection' },
  none: { src: '/assets/images/shipping-logistics.jpg', alt: 'Container handling at the port of departure' },
};

const routeSteps = [
  { num: '01', label: 'Origin', place: 'South & East China', short: 'China', desc: 'Shenzhen, Dongguan, Ningbo, and Shanghai manufacturing clusters.' },
  { num: '02', label: 'Consolidation', place: 'Hong Kong Hub', short: 'Hong Kong', desc: 'Free-port export clearance, container packing, and trade finance.' },
  { num: '03', label: 'Destination', place: 'North America', short: 'North America', desc: 'Long Beach, Los Angeles, and East Coast port-to-warehouse delivery.' },
];

export default function HomePage() {
  const siteUrl = useJsonLdSiteUrl();
  const pageUrl = `${siteUrl}/`;
  const jsonLd = buildJsonLd(siteUrl, pageUrl);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={mediaUrl('pages/home/hero-container-terminal')} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={mediaUrl('pages/home/hero-container-terminal')} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* overflow-clip, not overflow-hidden: both clip, but hidden makes <main>
          a scroll container, which stops position: sticky working inside it
          (the services sequence pins beneath the header). */}
      <main id="main" className="overflow-clip">

        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Asymmetric: the text sits in a scrimmed well on
            the left, the photograph is left legible on the right. The
            previous treatment washed the image to 30% across its whole
            width, which read as grey noise rather than a port.
            The entrance is CSS (.hero-photo, .hero-rise), so the hero
            never waits on JavaScript to become visible.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-background">

          <div className="hero-photo absolute inset-0">
            <img
              src={mediaUrl('pages/home/hero-container-terminal')}
              alt="Container terminal at the port of departure"
              width={1800} height={1200}
              loading="eager" fetchPriority="high"
              className="h-full w-full object-cover"
            />
            {/* Directional scrim. Near-opaque behind the copy well, clearing to
                the right so the photograph stays readable. Only opens up from
                `lg`: below that the headline spans the full width, so the scrim
                has to stay heavy the whole way across to hold contrast. */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/95 lg:via-background/92 lg:to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
          </div>

          {/* A faint gold light behind the copy, desktop only: below lg the copy crosses the photograph, where any
              tint would cost contrast. */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-[18%] hidden h-[560px] w-[760px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.09),transparent)] lg:block" />

          <div className="relative flex flex-1 flex-col justify-center px-5 pt-28 pb-16 sm:px-8 lg:px-14">
            <div className="mx-auto w-full max-w-[1440px]">
              <div className="max-w-[46rem]">

                <div className="hero-rise mb-8 inline-flex items-center gap-2" style={heroDelay(0.05)}>
                  <div className="h-px w-8 bg-gold" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                    {home.hero.eyebrow}
                  </span>
                </div>

                <h1
                  className="hero-rise font-heading text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.03em] text-balance text-foreground"
                  style={heroDelay(0.15)}
                >
                  {home.hero.title}
                </h1>

                <p className="hero-rise mt-8 max-w-xl text-base leading-[1.8] text-muted-foreground lg:text-lg" style={heroDelay(0.25)}>
                  {home.hero.description}
                </p>

                <div className="hero-rise mt-10 flex flex-wrap items-center gap-6" style={heroDelay(0.35)}>
                  {/* The hover pill as the link itself, not a button inside one. */}
                  <InteractiveHoverLink
                    to="/contact"
                    className="border-accent bg-accent text-accent-foreground hover:bg-accent-hover text-sm tracking-wide shadow-teal"
                  >
                    {home.hero.primaryCta}
                  </InteractiveHoverLink>
                  <Link001 href="/trade-services" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                    <span>{home.hero.secondaryCta}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link001>
                </div>

                <ul aria-label="Assurances" className="hero-rise mt-10 flex flex-wrap gap-2.5" style={heroDelay(0.45)}>
                  {heroAssurances.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md"
                    >
                      <Icon size={14} aria-hidden="true" className="text-accent-on-tint" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-end px-5 pb-8 sm:px-8 lg:px-14">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gold/50" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {home.hero.reachLabel}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — METRIC BAND. One container split by hairlines, not four
            floating cards. Short by design: it is a beat between the
            hero and the body, not a section.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <dl className="grid grid-cols-2 divide-x divide-y divide-border border-x border-border sm:divide-y-0 lg:grid-cols-4">
              {metrics.map(({ value, label }) => (
                <div key={label} className="px-6 py-8 lg:px-8 lg:py-10">
                  <dd className="font-heading text-3xl text-accent-on-tint sm:text-4xl">{value}</dd>
                  <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 — CARRIER STRIP. Thin. Deliberately the quietest band.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-card py-4">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Verified Alliances
              </p>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="flex-1 overflow-hidden">
                <LogoSlider logos={carrierLogos} speed={26} showBlur={true} pauseOnHover={true} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4 — SERVICES SEQUENCE. One service at a time: the section
            pins beneath the header and scrolling advances through the
            four services, with the brief and a numbered index holding
            still beside the stage. Replaces a four-row list that showed
            every service at once.
        ═══════════════════════════════════════════════════════ */}
        <ServicesSequence
          eyebrow={home.services.eyebrow}
          title={home.services.title}
          intro="End-to-end procurement and supply chain oversight for North American retail and wholesale buyers."
          cta={{ href: '/trade-services', label: 'Explore trade services & governance' }}
          steps={home.services.items.map((item) => ({
            title: item.title,
            text: item.text,
            image: serviceImages[item.image] ?? serviceImages.none,
          }))}
        />

        {/* ═══════════════════════════════════════════════════════
            5 — AUDIENCE SEGMENTER. Owns its own section wrapper: both
            commercial profiles side by side, aligned to the page
            container.
        ═══════════════════════════════════════════════════════ */}
        <AudienceSegmenter />

        {/* ═══════════════════════════════════════════════════════
            6 — NETWORK. Narrow editorial measure against a gold spine,
            then the route drawn as a WebGL schematic (server-rendered as
            SVG until it loads) above the three stages that control it.
        ═══════════════════════════════════════════════════════ */}
        {/* overflow-clip, not overflow-hidden: on phones the route drawing pins beneath the header while its stages
            scroll past, and a hidden overflow would make this section the scroll container and stop that. */}
        <section className="relative overflow-clip bg-background py-24 lg:py-32">
          <div className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[500px] -translate-y-1/2 bg-[radial-gradient(ellipse,hsl(42_80%_55%/0.05)_0%,transparent_70%)]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <Reveal className="max-w-[42rem] border-l-2 border-gold/70 pl-8 sm:pl-10">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {home.network.eyebrow}
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
                {home.network.title}
              </h2>
              <p className="mt-6 text-base leading-[1.8] text-muted-foreground">
                {home.network.text}
              </p>
              <Link001
                href="/trade-services"
                className="mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-accent-on-tint transition-colors hover:text-foreground"
              >
                <span>View international trade corridors</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link001>
            </Reveal>

            <Reveal delay={0.1} className="mt-16">
              <p className="font-heading text-2xl leading-[1.15] text-foreground sm:text-3xl">
                {home.network.routeStatement}
              </p>

              <TradeRouteExplorer steps={routeSteps} />
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            7 — CLOSING CTA. One raised panel on the page ground, with a
            bright-to-deep gold rule along its top edge and the two facts a
            buyer wants before writing in.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 shadow-[0_40px_80px_-44px_hsl(220_45%_15%/0.28)] sm:px-10 lg:px-16 lg:py-16">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.10),transparent)]" />

              <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="h-px w-6 bg-gold" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                      {home.cta.eyebrow}
                    </span>
                  </div>
                  <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
                    {home.cta.title}
                  </h2>
                  <p className="mt-5 max-w-lg text-base leading-[1.8] text-muted-foreground">
                    {home.cta.text}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-6 lg:items-end">
                  <Link
                    to="/contact"
                    className="group inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-teal transition-all duration-300 hover:bg-accent-hover hover:shadow-teal-lg"
                  >
                    <span>{home.cta.button}</span>
                    <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground lg:items-end">
                    <li className="flex items-center gap-2">
                      <Clock size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Reply within one business day
                    </li>
                    <li className="flex items-center gap-2">
                      <Users size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Reviewed by principals in Hong Kong and Shenzhen
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

      </main>
    </>
  );
}
