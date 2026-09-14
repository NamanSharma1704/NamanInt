import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import { MoveUpRight } from 'lucide-react';
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
        {/* 1. Full-bleed photo hero. Below lg the text runs across the whole photograph, so the wash stays at 95%; the solid
            bottom band keeps the footnote legible over the dark corner of the image. */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-background from-10% via-background/70 via-25% to-transparent to-55%" />
          </figure>

          <div className="relative mx-auto flex min-h-[72vh] max-w-[1440px] flex-col justify-center px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              {/* Rule + caps, matching the hero eyebrow on the homepage. The
                  translucent pill this replaces was the only badge of its kind
                  in the site. */}
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
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent/60 bg-accent text-accent-foreground hover:bg-accent-hover text-sm tracking-wide shadow-teal-lg">
                    Initiate Trade Program
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="#disciplines"
                  className="text-sm font-semibold text-muted-foreground hover:text-accent-on-tint transition-colors"
                >
                  <span>Explore Core Disciplines</span>
                </Link001>
              </div>
            </motion.div>
            {/* Same rule-and-caps footnote the homepage hero carries bottom
                right, in place of a solid accent slab pinned to the corner. */}
            <div className="absolute bottom-6 right-5 flex items-center gap-3 sm:right-8 lg:right-10">
              <div className="h-px w-8 bg-gold/50" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Shenzhen &amp; Hong Kong Operational Centers · Est. 2008
              </p>
            </div>
          </div>
        </section>

        {/* 2. 4-Stat Strip with dividers */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 divide-x divide-border lg:grid-cols-4">
              {[
                { counter: <AnimeCounter value={18} suffix="+" duration={1600} />, unit: 'Years', label: 'Trade Continuity', desc: 'Established Hong Kong 2008. Uninterrupted Pacific procurement.' },
                { counter: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1400} />, unit: null, label: 'Defect Ceiling', desc: 'ANSI/ASQ Z1.4 Level II pre-shipment AQL sampling.' },
                { counter: <AnimeCounter value={100} suffix="%" duration={1800} />, unit: null, label: 'Pre-Shipment SLA', desc: 'Zero containers dispatched without verified sign-off.' },
                { counter: <AnimeCounter value={4} duration={1200} />, unit: 'Hubs', label: 'Physical Presence', desc: 'Shenzhen · Hong Kong · California · Manchester' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-1 px-6 py-10 lg:px-10">
                  <p className="font-heading text-3xl font-bold text-accent-on-tint sm:text-4xl">
                    {s.counter}{s.unit && <span className="ml-1 text-xl text-muted-foreground">{s.unit}</span>}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Clean Interactive Disciplines Showcase */}
        <div id="disciplines">
          <TradeDisciplineShowcase />
        </div>

        {/* 4. Streamlined Governance Standard Table */}
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

        {/* 6. Interactive Trade Scope & Inquiry Configurator */}
        <TradeScopeEstimator />

        {/* 7. Closing CTA. Short, full-bleed and flat — the same closing band
               the homepage uses. Was a rounded, shadowed card floating inside a
               717px section, which is the boxed vocabulary this redesign drops. */}
        <section className="relative overflow-hidden bg-card py-20 lg:py-24">
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[600px] bg-[radial-gradient(ellipse,hsl(42_80%_55%/0.12)_0%,transparent_70%)] blur-[60px]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div
              {...reveal(reducedMotion)}
              className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between"
            >
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

              <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                <Link
                  to="/contact"
                  className="group inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-teal-lg"
                >
                  <span>Initiate Trade Program</span>
                  <MoveUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <p className="max-w-xs text-xs leading-[1.7] text-muted-foreground lg:text-right">
                  Direct response within 1 business day across US and Asia business hours.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
