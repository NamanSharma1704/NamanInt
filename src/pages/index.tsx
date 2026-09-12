import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import { ArrowRight, Anchor, ShieldCheck, Plane, Ship, TrendingUp, Globe2, Package, Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { home } from 'virtual:content';
import AudienceSegmenter from '../components/AudienceSegmenter';
import ResponsiveImage from '@/components/ResponsiveImage';
import { BorderBeam } from '@/components/ui/border-beam';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { LogoSlider } from '@/components/ui/logo-slider';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';
import { AnimeCorridor } from '@/components/ui/anime-corridor';

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
  <div key="fiata" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><ShieldCheck size={13} className="text-accent" /><span>FIATA International</span></div>,
  <div key="fmc" className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"><ShieldCheck size={13} className="text-accent" /><span>FMC Licensed NVOCC</span></div>,
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
            HERO — Full viewport, dramatic dark treatment
        ═══════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#050E1A]">

          {/* Background image with dramatic gradient fade */}
          <motion.div
            initial={{ scale: reducedMotion ? 1 : 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 1.8, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img
              src={mediaUrl('pages/home/hero-container-terminal')}
              alt="International port terminal"
              width={1800} height={1200}
              loading="eager" fetchPriority="high"
              className="h-full w-full object-cover opacity-30"
            />
            {/* Multi-layer gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050E1A]/60 via-transparent to-[#050E1A]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050E1A]/80 via-[#050E1A]/20 to-transparent" />
          </motion.div>

          {/* Content */}
          <div className="relative flex flex-1 flex-col justify-center px-5 pt-24 pb-16 sm:px-8 lg:px-14">
            <div className="mx-auto w-full max-w-[1440px]">

              {/* Eyebrow tag */}
              <motion.div {...heroAnim(reducedMotion, 0.05)} className="inline-flex items-center gap-2 mb-8">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                  {home.hero.eyebrow}
                </span>
              </motion.div>

              {/* Giant headline */}
              <motion.h1
                {...heroAnim(reducedMotion, 0.15)}
                className="font-heading text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.03em] text-white max-w-5xl"
              >
                {home.hero.title}
              </motion.h1>

              {/* Subtext + CTA row */}
              <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                <motion.p
                  {...heroAnim(reducedMotion, 0.25)}
                  className="max-w-lg text-base leading-[1.8] text-white/70 lg:text-lg"
                >
                  {home.hero.description}
                </motion.p>

                <motion.div {...heroAnim(reducedMotion, 0.35)} className="flex items-center gap-5 shrink-0">
                  <Link to="/contact">
                    <InteractiveHoverButton className="border-accent bg-accent text-white hover:bg-accent/90 text-sm tracking-wide">
                      {home.hero.primaryCta}
                    </InteractiveHoverButton>
                  </Link>
                  <Link001 href="/trade-services" className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
                    <span>{home.hero.secondaryCta}</span>
                    <ArrowRight size={14} />
                  </Link001>
                </motion.div>
              </div>

              {/* BENTO STATS GRID */}
              <motion.div
                {...heroAnim(reducedMotion, 0.45)}
                className="mt-20 grid grid-cols-2 gap-3 lg:grid-cols-4"
              >
                {[
                  { counter: <AnimeCounter value={16} suffix="+" duration={1800} />, unit: 'Years', label: 'Trade Continuity', icon: Clock },
                  { counter: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1600} />, unit: null, label: 'Defect Ceiling', icon: ShieldCheck },
                  { counter: <AnimeCounter value={100} suffix="%" duration={2000} />, unit: null, label: 'Pre-Shipment SLA', icon: Package },
                  { counter: <AnimeCounter value={4} duration={1400} />, unit: 'Hubs', label: 'Global Offices', icon: Globe2 },
                ].map(({ counter, unit, label, icon: Icon }, i) => (
                  <div
                    key={label}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-6 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-white/8"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <BorderBeam
                      duration={14 + i * 2}
                      colorFrom="#0E7B7A"
                      colorTo="#115E59"
                      borderWidth={1.5}
                      borderRadius={12}
                    />
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={14} className="text-accent" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{label}</span>
                    </div>
                    <p className="font-heading text-3xl font-bold text-white sm:text-4xl">
                      {counter}
                      {unit && <span className="ml-1 text-base font-normal text-white/70">{unit}</span>}
                    </p>
                    {/* Hover teal glow */}
                    <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Reach label at bottom right */}
          <div className="relative flex items-center justify-end px-5 pb-6 sm:px-8 lg:px-14">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-accent/50" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                {home.hero.reachLabel}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CARRIER TICKER
        ═══════════════════════════════════════════════════════ */}
        <section className="border-y border-border bg-card py-4">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Verified Alliances
              </p>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex-1 overflow-hidden">
                <LogoSlider logos={carrierLogos} speed={26} showBlur={true} pauseOnHover={true} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CAPABILITIES — Dark section, dramatic layout
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-[#070F1C] py-28 lg:py-36">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">

            {/* Section header */}
            <motion.div {...fade(reducedMotion)} className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-20">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">Core Capabilities</span>
                </div>
                <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.025em] text-white max-w-xl">
                  {home.services.eyebrow}
                </h2>
              </div>
              <p className="max-w-md text-base leading-[1.8] text-white/70 lg:text-right">
                End-to-end procurement and supply chain oversight for North American retail and wholesale buyers.
              </p>
            </motion.div>

            {/* 2-col magazine grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {home.services.items.map((item, index) => (
                <motion.article
                  key={item.title}
                  {...fade(reducedMotion, index * 0.1)}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] transition-all duration-500 hover:border-accent/30 hover:bg-white/[0.05]"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    {item.image === 'materials' && (
                      <ResponsiveImage src="/assets/images/sourcing-direction.jpg" alt="Trade sourcing specialists" sizes="(min-width: 1440px) 660px, (min-width: 768px) 50vw, 100vw" loading="lazy"
                        className="aspect-[16/9] w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
                    )}
                    {item.image === 'warehouse' && (
                      <ResponsiveImage src="/assets/images/supplier-coordination.jpg" alt="Supplier coordination" sizes="(min-width: 1440px) 660px, (min-width: 768px) 50vw, 100vw" loading="lazy"
                        className="aspect-[16/9] w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
                    )}
                    {item.image === 'detail' && (
                      <ResponsiveImage src="/assets/images/quality-inspection.jpg" alt="Quality inspection" sizes="(min-width: 1440px) 660px, (min-width: 768px) 50vw, 100vw" loading="lazy"
                        className="aspect-[16/9] w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
                    )}
                    {item.image === 'none' && (
                      <ResponsiveImage src="/assets/images/shipping-logistics.jpg" alt="Shipping logistics" sizes="(min-width: 1440px) 660px, (min-width: 768px) 50vw, 100vw" loading="lazy"
                        className="aspect-[16/9] w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
                    )}
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Number badge */}
                    <div className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/90 text-[11px] font-bold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-7">
                    <h3 className="font-heading text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-[1.75] text-white/50">{item.text}</p>
                    <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-on-dark opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span>Learn more</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  {/* Bottom teal line on hover */}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                </motion.article>
              ))}
            </div>

            {/* CTA link */}
            <motion.div {...fade(reducedMotion)} className="mt-14 flex justify-center">
              <Link
                to="/trade-services"
                className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-accent/50 hover:bg-accent/10 hover:text-white"
              >
                <span>Explore trade services & governance</span>
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            AUDIENCE SEGMENTER — Commercial Pathways
        ═══════════════════════════════════════════════════════ */}
        <AudienceSegmenter />

        {/* ═══════════════════════════════════════════════════════
            ROUTE NETWORK — Light section for contrast
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background py-28 lg:py-36">
          {/* Subtle radial teal glow */}
          <div className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[500px] -translate-y-1/2 bg-[radial-gradient(ellipse,hsl(179_80%_27%/0.06)_0%,transparent_70%)]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <motion.div {...fade(reducedMotion)} className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.3fr] lg:items-center">

              {/* Left: Text */}
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{home.network.eyebrow}</span>
                </div>
                <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-foreground">
                  {home.network.title}
                </h2>
                <p className="mt-6 text-base leading-[1.8] text-muted-foreground max-w-md">
                  {home.network.text}
                </p>
                <div className="mt-8">
                  <Link001 href="/trade-services" className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-foreground transition-colors w-fit">
                    <span>View international trade corridors</span>
                    <ArrowRight size={14} />
                  </Link001>
                </div>
              </div>

              {/* Right: Premium Route Card */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                <BorderBeam duration={18} colorFrom="#0E7B7A" colorTo="#115E59" borderWidth={1.5} borderRadius={16} />

                {/* Header */}
                <div className="border-b border-border bg-muted/50 px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Live Route Architecture</span>
                  </div>
                </div>

                <div className="p-8 sm:p-10">
                  <p className="font-heading text-2xl font-medium text-foreground sm:text-3xl leading-[1.15]">
                    {home.network.routeStatement}
                  </p>

                  {/* Steps */}
                  <div className="mt-8 space-y-5">
                    {[
                      { num: '01', label: 'Origin', place: 'South & East China', desc: 'Shenzhen, Dongguan, Ningbo, and Shanghai manufacturing clusters.' },
                      { num: '02', label: 'Consolidation', place: 'Hong Kong Hub', desc: 'Free-port export clearance, container packing, and trade finance.' },
                      { num: '03', label: 'Destination', place: 'North America', desc: 'Long Beach, Los Angeles, and East Coast port-to-warehouse delivery.' },
                    ].map((step, i) => (
                      <div key={step.num} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-[11px] font-bold text-accent-on-tint border border-accent/25">
                            {step.num}
                          </div>
                          {i < 2 && <div className="mt-1 h-10 w-px bg-border" />}
                        </div>
                        <div className="pb-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{step.label}</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{step.place}</p>
                          <p className="mt-1 text-xs leading-[1.65] text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <AnimeCorridor origin={home.network.origin} destination={home.network.destination} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CLOSING CTA — Full dark, dramatic
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#050E1A] py-28 lg:py-36">

          {/* Teal light bloom */}
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[600px] bg-[radial-gradient(ellipse,hsl(179_80%_27%/0.18)_0%,transparent_70%)] blur-[60px]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
            <motion.div
              {...fade(reducedMotion)}
              className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 lg:grid-cols-[1.3fr_0.7fr]"
            >
              {/* Content panel */}
              <div className="relative flex flex-col justify-between bg-white/[0.03] px-10 py-16 sm:px-14 lg:px-16 lg:py-20 backdrop-blur-sm">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 h-[2px] w-32 bg-gradient-to-r from-accent to-transparent" />

                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-px w-6 bg-accent" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">{home.cta.eyebrow}</span>
                  </div>
                  <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-white max-w-xl">
                    {home.cta.title}
                  </h2>
                  <p className="mt-6 max-w-lg text-base leading-[1.8] text-white/70">
                    {home.cta.text}
                  </p>
                </div>

                <div className="mt-12">
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_40px_hsl(179_80%_27%/0.35)]"
                  >
                    <span>{home.cta.button}</span>
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Image panel */}
              <figure className="relative min-h-72 lg:min-h-full">
                <ResponsiveImage
                  src="/assets/images/closing-cta-terminal.jpg"
                  alt="International maritime cargo terminal at twilight"
                  sizes="(min-width: 1024px) 35vw, 100vw"
                  loading="lazy"
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050E1A]/80 via-[#050E1A]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050E1A]/60 to-transparent" />
              </figure>
            </motion.div>

            {/* Trust metrics strip below CTA */}
            <motion.div {...fade(reducedMotion)} className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { icon: TrendingUp, val: '16+', label: 'Years in Pacific trade' },
                { icon: Package, val: '100%', label: 'Pre-shipment SLA' },
                { icon: Globe2, val: '4', label: 'Global operating hubs' },
                { icon: ShieldCheck, val: '<0.5%', label: 'Target defect rate' },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-5 py-4">
                  <Icon size={16} className="shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-white">{val}</p>
                    <p className="text-xs text-white/70">{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
