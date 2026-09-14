import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import { Clock, MapPin, MoveUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import TradeDisciplineShowcase from '../components/TradeDisciplineShowcase';
import TradeGovernanceTable from '../components/TradeGovernanceTable';
import TradeScopeEstimator from '../components/TradeScopeEstimator';
import ContainerLoadSequence from '@/components/container-load/ContainerLoadSequence';
import { LOAD_SUMMARY } from '@/lib/container-load/geometry';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';

const title = 'Trade Services & Procurement Architecture | NAMAN INTERNATIONAL LTD';
const description =
  'Bespoke international trade coordination, factory qualification, forensic AQL 2.5 quality audits, and Trans-Pacific container logistics.';
const buildJsonLd = (siteUrl: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${url}#webpage`,
  name: title,
  url,
  isPartOf: { '@id': `${siteUrl}/#website` },
  about: { '@id': `${siteUrl}/#organization` },
});

const reveal = (reduced: boolean | null) => ({
  initial: { opacity: 0, y: reduced ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduced ? 0 : 0.5, ease: 'easeOut' as const },
});

const stats = [
  { counter: <AnimeCounter value={18} suffix="+" duration={1600} />, unit: 'Years', label: 'Trade Continuity', desc: 'Established Hong Kong 2008. Uninterrupted Pacific procurement.' },
  { counter: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1400} />, unit: null, label: 'Defect Ceiling', desc: 'ANSI/ASQ Z1.4 Level II pre-shipment AQL sampling.' },
  { counter: <AnimeCounter value={100} suffix="%" duration={1800} />, unit: null, label: 'Pre-Shipment SLA', desc: 'Zero containers dispatched without verified sign-off.' },
  { counter: <AnimeCounter value={4} duration={1200} />, unit: 'Hubs', label: 'Physical Presence', desc: 'Shenzhen · Hong Kong · California · Manchester' },
];

export default function TradeServicesPage() {
  const reducedMotion = useReducedMotion();
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/trade-services`;
  const jsonLd = buildJsonLd(siteUrl, url);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta
          property="og:image"
          content={mediaUrl('pages/trade-services/procurement-desk')}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={mediaUrl('pages/trade-services/procurement-desk')}
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* overflow-clip, not overflow-hidden: hidden makes <main> a scroll container, which breaks position: sticky for
          the pinned container sequence. */}
      <main className="overflow-clip">
        {/* 1. Full-bleed photo hero. Below lg the text runs across the whole photograph, so the wash stays at 95%. The
            bottom fifth is solid, which keeps the footnote legible over the dark corner of the image and gives the stat
            panel a clean edge to overlap. */}
        <section className="relative min-h-[72vh] overflow-hidden">
          <figure className="absolute inset-0">
            <img
              src={mediaUrl('pages/trade-services/procurement-desk')}
              alt="Professional reviewing international procurement documents"
              width={1400}
              height={1000}
              loading="eager"
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/95 to-background/95 lg:via-background/90 lg:to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background from-20% via-background/70 via-35% to-transparent to-60%" />
          </figure>

          {/* A faint gold light behind the copy, desktop only: below lg the copy crosses the photograph, where any tint
              would cost contrast. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-48 top-[10%] hidden h-[520px] w-[720px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.10),transparent)] lg:block"
          />

          <div className="relative mx-auto flex min-h-[72vh] max-w-[1440px] flex-col justify-center px-5 pb-28 pt-16 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              {/* Rule + caps, matching the hero eyebrow on the homepage. */}
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  Trade Coordination &amp; Sourcing Oversight
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-balance text-foreground sm:text-5xl lg:text-6xl">
                Forensic oversight from factory floor to port delivery.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-[1.75] text-muted-foreground sm:text-lg">
                We coordinate international buying programs for North American retail and wholesale importers, providing direct engineering supervision across the Pearl River Delta, 100% pre-shipment AQL audits, and uninterrupted chain of custody.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Link to="/contact" className="w-fit">
                  <InteractiveHoverButton className="border-accent/60 bg-accent text-accent-foreground hover:bg-accent-hover text-sm tracking-wide shadow-teal-lg">
                    Initiate Trade Program
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="#disciplines"
                  className="w-fit text-sm font-semibold text-muted-foreground transition-colors hover:text-accent-on-tint"
                >
                  <span>Explore Core Disciplines</span>
                </Link001>
              </div>
            </motion.div>

            {/* Footnote. In the flow on phones, where the copy already reaches the bottom of the photograph and a pinned
                label collided with the links; pinned bottom right, above the stat panel, from sm up. */}
            <div className="mt-12 flex items-center gap-3 sm:absolute sm:bottom-24 sm:right-8 sm:mt-0 lg:right-10">
              <div className="h-px w-8 shrink-0 bg-gold/50" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Shenzhen &amp; Hong Kong Operational Centers · Est. 2008
              </p>
            </div>
          </div>
        </section>

        {/* 2. Headline figures on a raised panel overlapping the hero's lower edge. The hairlines are a 1px gap over the
            border colour, so the grid needs no per-cell rules at either breakpoint. */}
        <section className="relative z-10 -mt-16 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_28px_60px_-32px_hsl(220_45%_15%/0.28)] lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col bg-card px-5 py-7 sm:px-6 lg:px-9 lg:py-9">
                <p className="font-heading text-3xl font-bold text-accent-on-tint sm:text-4xl">
                  {s.counter}
                  {s.unit && <span className="ml-1 text-xl text-muted-foreground">{s.unit}</span>}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Core disciplines */}
        {/* tabIndex -1 so the "Explore Core Disciplines" link can move focus here as well as scroll. */}
        <div id="disciplines" tabIndex={-1} className="scroll-mt-20 outline-none">
          <TradeDisciplineShowcase />
        </div>

        {/* 4. Governance comparison */}
        <TradeGovernanceTable />

        {/* 5. Container stuffing, driven by scrolling: set down, doors open, stuffed to plan, loaded. */}
        <ContainerLoadSequence
          eyebrow="Container Stuffing Supervision"
          title="Every container loaded to plan and verified before sealing."
          intro="On each Standard Container Run, our supervisors attend the load in person. Every stage below is signed off on site before the next one begins."
          steps={[
            {
              title: 'Positioning and release',
              text: 'The container is landed square on its marks. Lifting gear is released only once level and position are confirmed.',
            },
            {
              title: 'Pre-loading inspection',
              text: 'Doors are opened and the unit is checked for cleanliness, moisture, odor and structural damage before any cargo is accepted.',
            },
            {
              title: 'Stowage to the load plan',
              text: 'Cartons are stowed from the front wall toward the doors, tier by tier, following an approved plan that keeps weight low and makes full use of the cube.',
            },
            {
              title: 'Final tally and sealing',
              text: `Doors are closed on ${LOAD_SUMMARY.cartons} cartons occupying ${LOAD_SUMMARY.cubeUsedPercent}% of the internal cube. The count is reconciled against the packing list before the seal number and VGM are recorded.`,
            },
          ]}
        />

        {/* 6. Interactive trade scope configurator */}
        <TradeScopeEstimator />

        {/* 7. Closing CTA: the raised panel the homepage closes on, with a bright-to-deep gold rule along its top edge and
            the reply facts beside the button. */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div
              {...reveal(reducedMotion)}
              className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 shadow-[0_40px_80px_-44px_hsl(220_45%_15%/0.28)] sm:px-10 lg:px-16 lg:py-16"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.10),transparent)]" />

              <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="h-px w-6 bg-gold" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                      Direct Procurement Partnership
                    </span>
                  </div>
                  <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
                    Ready to establish institutional oversight across your overseas manufacturing?
                  </h2>
                  <p className="mt-5 max-w-lg text-base leading-[1.8] text-muted-foreground">
                    Connect directly with our international trade directors in Hong Kong,
                    Shenzhen, or California to discuss order volume, factory vetting, or
                    specialized quality audit protocols.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-6 lg:items-end">
                  <Link
                    to="/contact"
                    className="group inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-teal transition-all duration-300 hover:bg-accent-hover hover:shadow-teal-lg"
                  >
                    <span>Initiate Trade Program</span>
                    <MoveUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                  <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground lg:items-end">
                    <li className="flex items-center gap-2">
                      <Clock size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Reply within one business day, US and Asia hours
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Trade directors in Hong Kong, Shenzhen and California
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
