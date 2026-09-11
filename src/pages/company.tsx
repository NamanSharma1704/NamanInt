import { Helmet } from '@dr.pogodin/react-helmet';
import { Building2, MapPin, Award, Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { company } from 'virtual:content';
import { BorderBeam } from '@/components/ui/border-beam';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';

const siteUrl = 'https://nevba9hqli.preview.c35.airoapp.ai';
const url = `${siteUrl}/company`;
const title = 'Company Profile & Global Infrastructure | NAMAN INTERNATIONAL LTD';
const description =
  'Founded in Hong Kong in 2008, NAMAN INTERNATIONAL LTD operates four strategic hubs in Shenzhen, Hong Kong, California, and Manchester, coordinating high-volume trade with Western institutional governance.';

const hubs = [
  {
    city: 'Shenzhen Hub',
    region: 'South China Production Epicenter',
    address: '6B65, 6th Floor, Sega Technology Park, Huaqiang North, Shenzhen',
    role: 'Active ground presence on factory assembly lines, tooling calibration, mold inspection, and daily production milestone tracking.',
    badge: 'Operations & Engineering',
    tag: 'Ground Zero',
  },
  {
    city: 'Hong Kong SAR Hub',
    region: 'Global Trade & Finance Gateway',
    address: 'Unit 04–05, 16th Floor, The Broadway, No. 54–62 Lockhart Road, Wan Chai',
    role: 'Corporate headquarters, international trade finance, letters of credit (LC), free-port customs clearance, and global documentation.',
    badge: 'Corporate & Finance',
    tag: 'Headquarters',
  },
  {
    city: 'California Logistics Desk',
    region: 'North American Gateway',
    address: 'Richmond Ave, Fremont, CA 94536, USA',
    role: 'Port of Long Beach and Los Angeles drayage coordination, US West Coast customs clearance, and North American retail account management.',
    badge: 'Logistics & Client Relations',
    tag: 'Pacific Gateway',
  },
  {
    city: 'Manchester Representative',
    region: 'UK & European Gateway',
    address: 'Union East (T1), 19 Water Street, Manchester, M3 4JQ, UK',
    role: 'British and European standards alignment, UKCA/CE compliance advisory, and trans-Atlantic trade coordination.',
    badge: 'European Standards',
    tag: 'European Desk',
  },
];

const milestones = [
  {
    year: '2008',
    title: 'Founding in Hong Kong',
    description: 'Incorporated in Hong Kong SAR to bridge North American commercial buyers directly with China’s rapidly growing industrial base.',
  },
  {
    year: '2014',
    title: 'Shenzhen Engineering Office',
    description: 'Opened dedicated technical facilities in Sega Technology Park to place bilingual quality engineers directly on assembly floors.',
  },
  {
    year: '2019',
    title: 'Trans-Pacific Maritime Consolidation',
    description: 'Pioneered structured FCL container consolidation protocols to reduce landed freight costs for multi-SKU retail importers.',
  },
  {
    year: '2024–2026',
    title: 'Institutional Governance Architecture',
    description: 'Standardized ANSI/ASQ Z1.4 Level II pre-shipment ceilings and automated milestone visibility for North American retail enterprises.',
  },
];

const governancePillars = [
  {
    icon: Award,
    title: 'Zero Component Substitution Guarantee',
    description: 'Every production batch strictly adheres to the approved golden prototype BOM. No unauthorized raw material or sub-component substitutions are permitted.',
  },
  {
    icon: Building2,
    title: 'Direct Tier-1 Factory Access',
    description: 'Complete commercial transparency. Our clients receive direct factory pricing without layered broker commissions or hidden margin markups.',
  },
  {
    icon: Clock,
    title: 'Standardized Pre-Shipment Defect Ceilings',
    description: 'Strict AQL 1.5/2.5 General Inspection Level II standards enforced before factory gate release. Defective lots are reworked prior to bill of lading issuance.',
  },
  {
    icon: MapPin,
    title: 'Social & Environmental Compliance',
    description: 'Mandatory audits for fair worker compensation, factory safety, and international environmental compliance across all active supplier partners.',
  },
];

const reveal = (reduced: boolean | null) => ({
  initial: { opacity: 0, y: reduced ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduced ? 0 : 0.45, ease: 'easeOut' as const },
});

export default function CompanyPage() {
  const reducedMotion = useReducedMotion();

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
        <meta property="og:image" content={`${siteUrl}/assets/images/supplier-coordination.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/supplier-coordination.jpg`} />
      </Helmet>

      <main className="overflow-hidden">
        {/* 1. Company Hero — Dark Banner */}
        <section className="relative overflow-hidden bg-primary py-20 sm:py-28 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,hsl(179_80%_27%/0.12)_0%,transparent_65%)]" />
          <div className="pointer-events-none absolute top-0 left-0 h-px w-full bg-gradient-to-r from-accent/50 via-accent/15 to-transparent" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {company.hero.eyebrow}
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-white sm:text-5xl lg:text-6xl">
                {company.hero.title}
              </h1>
              <p className="mt-6 text-base leading-[1.75] text-white/65 sm:text-lg">
                {company.hero.text} Since 2008, NAMAN INTERNATIONAL LTD has served as the on-the-ground operational partner for North American retail brands and wholesale distributors, combining local Chinese manufacturing fluency with Western institutional governance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent/60 bg-accent text-white hover:bg-accent/90 text-sm tracking-wide shadow-teal-lg">
                    {company.hero.cta}
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="/trade-services"
                  className="text-sm font-semibold text-white/70 hover:text-accent transition-colors"
                >
                  <span>Inspect trade services →</span>
                </Link001>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. Stat Strip */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {[
                { val: <AnimeCounter value={2008} duration={1400} />, label: 'Incorporated in Hong Kong' },
                { val: <AnimeCounter value={4} suffix=" Hubs" duration={1200} />, label: 'Global Strategic Offices' },
                { val: <AnimeCounter value={180} suffix="+" duration={1600} />, label: 'Audited Tier-1 Foundries' },
                { val: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1400} />, label: 'Landed Defect Ceiling' },
              ].map((s, i) => (
                <div key={i} className="px-6 py-10 lg:px-10">
                  <p className="font-heading text-2xl font-bold text-accent sm:text-3xl">{s.val}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. The 4 Global Strategic Hubs Matrix */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Global Operating Footprint
            </p>
            <h2 className="mt-2 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl">
              Strategic Hubs Across Four Regions
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              International trade cannot be managed from behind a desk three time zones away. We operate dedicated offices at every critical node of the Trans-Pacific supply chain.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {hubs.map((hub) => (
              <motion.div
                key={hub.city}
                {...reveal(reducedMotion)}
                className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-xs sm:p-10 overflow-hidden"
              >
                {hub.city === 'Hong Kong SAR Hub' && (
                  <BorderBeam size={220} duration={14} colorFrom="#8B4513" colorTo="#2a4365" borderWidth={1.5} />
                )}
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-md bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                      {hub.badge}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {hub.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 font-heading text-2xl font-bold text-foreground">
                    {hub.city}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mt-1">
                    {hub.region}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {hub.role}
                  </p>
                </div>

                <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
                    <span>{hub.address}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. Chronological Milestone Timeline (Inspired by Schneider) */}
        <section className="border-y border-border bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Sixteen-Year Trajectory
              </p>
              <h2 className="mt-2 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl">
                Evolution of Our Trade Infrastructure
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                From our origins as an independent Hong Kong trading firm to a comprehensive cross-border procurement and quality management network.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {milestones.map((m, idx) => (
                <div key={m.year} className="relative rounded-2xl border border-border bg-card p-6 shadow-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-bold text-accent">{m.year}</span>
                    <span className="text-xs font-bold text-muted-foreground">/ 0{idx + 1}</span>
                  </div>
                  <h4 className="mt-4 text-base font-bold text-foreground">{m.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Institutional Governance & Ethics Charter (Inspired by ConData) */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Operational Standards
            </p>
            <h2 className="mt-2 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl">
              Our Governance & Trade Ethics Charter
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              We eliminate the ambiguity and conflict of interest common among spot brokers and trading middlemen.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {governancePillars.map((p) => {
              const IconComp = p.icon;
              return (
                <div key={p.title} className="flex gap-5 rounded-2xl border border-border bg-card p-8 shadow-xs">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <IconComp size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Closing Executive Dialogue CTA */}
        <section className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <motion.div
            {...reveal(reducedMotion)}
            className="rounded-2xl bg-primary px-8 py-14 sm:px-12 lg:px-16 lg:py-20 shadow-md"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Direct Corporate Dialogue
              </p>
              <h2 className="mt-4 font-heading text-3xl leading-[1.1] text-primary-foreground sm:text-4xl lg:text-5xl">
                {company.cta.title}
              </h2>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-primary-foreground/80">
                {company.cta.text} Connect directly with our principals in Hong Kong or Shenzhen. We begin every new commercial partnership with an open, technically disciplined conversation.
              </p>
              <div className="mt-8">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-border/80 bg-accent text-accent-foreground hover:bg-secondary text-sm tracking-wide">
                    {company.cta.button}
                  </InteractiveHoverButton>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
