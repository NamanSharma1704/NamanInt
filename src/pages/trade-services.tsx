import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import { MoveUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import TradeDisciplineShowcase from '../components/TradeDisciplineShowcase';
import TradeGovernanceTable from '../components/TradeGovernanceTable';
import TradeScopeEstimator from '../components/TradeScopeEstimator';
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

      <main className="overflow-hidden">
        {/* 1. Dark Full-Bleed Hero */}
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/95 via-[#0A1628]/80 to-[#0A1628]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/50 via-transparent to-transparent" />
          </figure>

          <div className="relative mx-auto flex min-h-[72vh] max-w-[1440px] flex-col justify-center px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-on-dark">
                  Trade Coordination & Sourcing Oversight
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-white sm:text-5xl lg:text-6xl">
                Forensic oversight from factory floor to port delivery.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-[1.75] text-white/70 sm:text-lg">
                We coordinate international buying programs for North American retail and wholesale importers, providing direct engineering supervision across the Pearl River Delta, 100% pre-shipment AQL audits, and uninterrupted chain of custody.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent/60 bg-accent text-white hover:bg-accent/90 text-sm tracking-wide shadow-teal-lg">
                    Initiate Trade Program
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="#disciplines"
                  className="text-sm font-semibold text-white/75 hover:text-accent transition-colors"
                >
                  <span>Explore Core Disciplines</span>
                </Link001>
              </div>
            </motion.div>
            <div className="absolute bottom-0 left-5 sm:left-8 lg:left-10 bg-accent/85 px-6 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90">
                Shenzhen & Hong Kong Operational Centers · Est. 2008
              </p>
            </div>
          </div>
        </section>

        {/* 2. 4-Stat Strip with dividers */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 divide-x divide-border lg:grid-cols-4">
              {[
                { counter: <AnimeCounter value={16} suffix="+" duration={1600} />, unit: 'Years', label: 'Trade Continuity', desc: 'Established Hong Kong 2008. Uninterrupted Pacific procurement.' },
                { counter: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1400} />, unit: null, label: 'Defect Ceiling', desc: 'ANSI/ASQ Z1.4 Level II pre-shipment AQL sampling.' },
                { counter: <AnimeCounter value={100} suffix="%" duration={1800} />, unit: null, label: 'Pre-Shipment SLA', desc: 'Zero containers dispatched without verified sign-off.' },
                { counter: <AnimeCounter value={4} duration={1200} />, unit: 'Hubs', label: 'Physical Presence', desc: 'Shenzhen · Hong Kong · California · Manchester' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-1 px-6 py-10 lg:px-10">
                  <p className="font-heading text-3xl font-bold text-accent sm:text-4xl">
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

        {/* 5. Interactive Trade Scope & Inquiry Configurator */}
        <TradeScopeEstimator />

        {/* 6. Clean Closing Consultation Banner */}
        <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <motion.div
            {...reveal(reducedMotion)}
            className="relative overflow-hidden grid grid-cols-1 gap-10 bg-primary px-8 py-14 sm:px-12 lg:grid-cols-[1.25fr_0.75fr] lg:px-16 lg:py-20 rounded-2xl shadow-xl"
          >
            <div className="pointer-events-none absolute top-0 left-0 h-px w-full bg-gradient-to-r from-accent/60 via-accent/20 to-transparent" />
            <div>
              <p className="section-label text-white/70 before:bg-accent">
                Direct Procurement Partnership
              </p>
              <h2 className="mt-5 max-w-2xl font-heading text-3xl leading-[1.08] text-white sm:text-4xl lg:text-5xl">
                Ready to establish institutional oversight across your overseas manufacturing?
              </h2>
              <p className="mt-5 max-w-xl text-base leading-[1.75] text-white/65">
                Connect directly with our international trade directors in Hong Kong, Shenzhen, or California to discuss order volume, factory vetting, or specialized quality audit protocols.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-4 lg:items-end">
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 rounded-lg bg-accent px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-teal-lg transition-all duration-200 hover:bg-accent/90"
              >
                <span>Initiate Trade Program</span>
                <MoveUpRight size={16} />
              </Link>
              <p className="text-xs text-white/70">
                Direct response within 1 business day across US and Asia business hours.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
