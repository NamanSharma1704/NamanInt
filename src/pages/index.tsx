import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import { ArrowRight, Anchor, Plane, Ship } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { home } from 'virtual:content';
import AudienceSegmenter from '../components/AudienceSegmenter';
import ResponsiveImage from '@/components/ResponsiveImage';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { LogoSlider } from '@/components/ui/logo-slider';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';
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

const heroAnim = (reduced: boolean | null, delay = 0) => ({
  initial: { opacity: 0, y: reduced ? 0 : 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
});

const fade = (reduced: boolean | null, delay = 0) => ({
  initial: { opacity: 0, y: reduced ? 0 : 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
});

const carrierLogos = [
  <div key="maersk" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Ship size={13} className="text-accent" /><span>Maersk Line</span></div>,
  <div key="hapag" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Anchor size={13} className="text-accent" /><span>Hapag-Lloyd</span></div>,
  <div key="msc" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Ship size={13} className="text-accent" /><span>MSC Mediterranean</span></div>,
  <div key="cosco" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Ship size={13} className="text-accent" /><span>COSCO Shipping</span></div>,
  <div key="cma" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Anchor size={13} className="text-accent" /><span>CMA CGM Group</span></div>,
  <div key="iata" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><Plane size={13} className="text-accent" /><span>IATA Cargo Reg</span></div>,
];

/** The four headline metrics. Declared once — they previously appeared both in
 *  the hero and again above the footer, which is duplication, not emphasis. */
const metrics = [
  { value: <AnimeCounter value={18} suffix="+" duration={1800} />, label: 'Years in Pacific trade' },
  { value: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1600} />, label: 'Target defect rate' },
  { value: <AnimeCounter value={100} suffix="%" duration={2000} />, label: 'Pre-shipment SLA' },
  { value: <AnimeCounter value={4} duration={1400} />, label: 'Global operating hubs' },
];

/** Photograph per service row, keyed by the content file's `image` token. */
const serviceImages: Record<string, { src: string; alt: string }> = {
  materials: { src: '/assets/images/sourcing-direction.jpg', alt: 'Trade sourcing specialists reviewing product samples' },
  warehouse: { src: '/assets/images/supplier-coordination.jpg', alt: 'Supplier coordination on the factory floor' },
  detail: { src: '/assets/images/quality-inspection.jpg', alt: 'Pre-shipment quality inspection' },
  none: { src: '/assets/images/shipping-logistics.jpg', alt: 'Container handling at the port of departure' },
};

const routeSteps = [
  { num: '01', label: 'Origin', place: 'South & East China', desc: 'Shenzhen, Dongguan, Ningbo, and Shanghai manufacturing clusters.' },
  { num: '02', label: 'Consolidation', place: 'Hong Kong Hub', desc: 'Free-port export clearance, container packing, and trade finance.' },
  { num: '03', label: 'Destination', place: 'North America', desc: 'Long Beach, Los Angeles, and East Coast port-to-warehouse delivery.' },
];

export default function HomePage() {
  const reducedMotion = useReducedMotion();
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

      <main className="overflow-hidden">

        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Asymmetric: the text sits in a scrimmed well on
            the left, the photograph is left legible on the right. The
            previous treatment washed the image to 30% across its whole
            width, which read as grey noise rather than a port.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#050E1A]">

          <motion.div
            initial={{ scale: reducedMotion ? 1 : 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 1.8, ease: 'easeOut' }}
            className="absolute inset-0"
          >
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#050E1A] via-[#050E1A]/95 to-[#050E1A]/85 lg:via-[#050E1A]/92 lg:to-[#050E1A]/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050E1A] via-transparent to-[#050E1A]/70" />
          </motion.div>

          <div className="relative flex flex-1 flex-col justify-center px-5 pt-28 pb-16 sm:px-8 lg:px-14">
            <div className="mx-auto w-full max-w-[1440px]">
              <div className="max-w-[46rem]">

                <motion.div {...heroAnim(reducedMotion, 0.05)} className="mb-8 inline-flex items-center gap-2">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                    {home.hero.eyebrow}
                  </span>
                </motion.div>

                <motion.h1
                  {...heroAnim(reducedMotion, 0.15)}
                  className="font-heading text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.03em] text-balance text-white"
                >
                  {home.hero.title}
                </motion.h1>

                <motion.p
                  {...heroAnim(reducedMotion, 0.25)}
                  className="mt-8 max-w-xl text-base leading-[1.8] text-white/80 lg:text-lg"
                >
                  {home.hero.description}
                </motion.p>

                <motion.div {...heroAnim(reducedMotion, 0.35)} className="mt-10 flex flex-wrap items-center gap-6">
                  <Link to="/contact">
                    <InteractiveHoverButton className="border-accent bg-accent text-white hover:bg-accent/90 text-sm tracking-wide">
                      {home.hero.primaryCta}
                    </InteractiveHoverButton>
                  </Link>
                  <Link001 href="/trade-services" className="flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                    <span>{home.hero.secondaryCta}</span>
                    <ArrowRight size={14} />
                  </Link001>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-end px-5 pb-8 sm:px-8 lg:px-14">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-accent/50" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
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
                  <dd className="font-heading text-3xl text-foreground sm:text-4xl">{value}</dd>
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
            4 — SERVICES RAIL. A sticky brief on the left against a
            numbered editorial sequence on the right. Replaces the 2x2
            card grid, which was the fourth consecutive two-column
            split on the page and ran to 1665px with no internal rhythm.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-[#070F1C] py-24 lg:py-32">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">

              <motion.div {...fade(reducedMotion)} className="lg:sticky lg:top-28 lg:self-start">
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                    {home.services.eyebrow}
                  </span>
                </div>
                <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.025em] text-balance text-white">
                  {home.services.title}
                </h2>
                <p className="mt-6 max-w-md text-base leading-[1.8] text-white/70">
                  End-to-end procurement and supply chain oversight for North American retail
                  and wholesale buyers.
                </p>
                <Link001
                  href="/trade-services"
                  className="mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-accent-on-dark transition-colors hover:text-white"
                >
                  <span>Explore trade services &amp; governance</span>
                  <ArrowRight size={14} />
                </Link001>
              </motion.div>

              <div className="border-t border-white/10">
                {home.services.items.map((item, index) => {
                  const photo = serviceImages[item.image] ?? serviceImages.none;
                  return (
                    <motion.article
                      key={item.title}
                      {...fade(reducedMotion, index * 0.06)}
                      className="grid items-start gap-x-8 gap-y-5 border-b border-white/10 py-10 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_15rem]"
                    >
                      <span className="font-mono text-xs tracking-[0.18em] text-accent-on-dark sm:pt-1">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="font-heading text-2xl leading-[1.15] text-white sm:text-[1.75rem]">
                          {item.title}
                        </h3>
                        <p className="mt-3 max-w-md text-base leading-[1.8] text-white/70">
                          {item.text}
                        </p>
                      </div>
                      <ResponsiveImage
                        src={photo.src}
                        alt={photo.alt}
                        sizes="(min-width: 1024px) 240px, 100vw"
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover sm:col-start-2 lg:col-start-3 lg:aspect-[5/4]"
                      />
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            5 — AUDIENCE SEGMENTER. Untouched this pass; it owns its own
            section wrapper and is the one remaining band still using
            the old card vocabulary.
        ═══════════════════════════════════════════════════════ */}
        <AudienceSegmenter />

        {/* ═══════════════════════════════════════════════════════
            6 — NETWORK. Narrow editorial measure against a teal spine,
            then the route drawn as a WebGL schematic (server-rendered as
            SVG until it loads) above the three stages that control it.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background py-24 lg:py-32">
          <div className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[500px] -translate-y-1/2 bg-[radial-gradient(ellipse,hsl(179_80%_27%/0.06)_0%,transparent_70%)]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <motion.div {...fade(reducedMotion)} className="max-w-[42rem] border-l-2 border-accent pl-8 sm:pl-10">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-tint">
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
                <ArrowRight size={14} />
              </Link001>
            </motion.div>

            <motion.div {...fade(reducedMotion, 0.1)} className="mt-16">
              <p className="font-heading text-2xl leading-[1.15] text-foreground sm:text-3xl">
                {home.network.routeStatement}
              </p>

              <TradeRouteExplorer
                steps={routeSteps}
                origin={home.network.origin}
                destination={home.network.destination}
              />
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            7 — CLOSING CTA. Short on purpose. The duplicate metric
            strip that used to sit here now lives in band 2.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#050E1A] py-20 lg:py-24">
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[600px] bg-[radial-gradient(ellipse,hsl(179_80%_27%/0.18)_0%,transparent_70%)] blur-[60px]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <motion.div
              {...fade(reducedMotion)}
              className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-2xl">
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-px w-6 bg-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                    {home.cta.eyebrow}
                  </span>
                </div>
                <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-white">
                  {home.cta.title}
                </h2>
                <p className="mt-5 max-w-lg text-base leading-[1.8] text-white/70">
                  {home.cta.text}
                </p>
              </div>

              <Link
                to="/contact"
                className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_40px_hsl(179_80%_27%/0.35)]"
              >
                <span>{home.cta.button}</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
