import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { Building2, MapPin, Award, Clock, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { company } from 'virtual:content';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';

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

const stats = [
  { val: <AnimeCounter value={2008} duration={1400} />, label: 'Incorporated in Hong Kong' },
  { val: <AnimeCounter value={4} suffix=" Hubs" duration={1200} />, label: 'Global Strategic Offices' },
  { val: <AnimeCounter value={180} suffix="+" duration={1600} />, label: 'Audited Tier-1 Foundries' },
  { val: <AnimeCounter value={0.5} prefix="<" suffix="%" decimals={1} duration={1400} />, label: 'Landed Defect Ceiling' },
];

const reveal = (reduced: boolean | null) => ({
  initial: { opacity: 0, y: reduced ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduced ? 0 : 0.45, ease: 'easeOut' as const },
});

export default function CompanyPage() {
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/company`;
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
        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Text-only dark banner.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-primary py-20 sm:py-28 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,hsl(179_80%_27%/0.12)_0%,transparent_65%)]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-accent/50 via-accent/15 to-transparent" />
          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                  {company.hero.eyebrow}
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-balance text-white sm:text-5xl lg:text-6xl">
                {company.hero.title}
              </h1>
              <p className="mt-6 text-base leading-[1.8] text-white/70 sm:text-lg">
                {company.hero.text} Since 2008, NAMAN INTERNATIONAL LTD has served as the
                on-the-ground operational partner for North American retail brands and wholesale
                distributors, combining local Chinese manufacturing fluency with Western
                institutional governance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent bg-accent text-sm tracking-wide text-white hover:bg-accent/90">
                    {company.hero.cta}
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="/trade-services"
                  className="flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                >
                  <span>Inspect trade services</span>
                  <ArrowRight size={14} />
                </Link001>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — STATS. The hairline-divided band used across the site.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <dl className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="px-6 py-10 lg:px-10">
                  <dd className="font-heading text-2xl text-accent sm:text-3xl">{s.val}</dd>
                  <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 — HUBS. An office directory: one hairline-ruled row per
            hub, reading across as place, role, address. Replaces four
            rounded cards in a two-column grid — the same arrangement
            the governance charter below also used — plus an
            off-palette brown BorderBeam on the Hong Kong card.
        ═══════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-px w-8 bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-tint">
                Global Operating Footprint
              </span>
            </div>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
              Strategic Hubs Across Four Regions
            </h2>
            <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
              International trade cannot be managed from behind a desk three time zones away. We
              operate dedicated offices at every critical node of the Trans-Pacific supply chain.
            </p>
          </motion.div>

          <ul className="mt-12 border-t border-border">
            {hubs.map((hub) => (
              <li
                key={hub.city}
                className="grid gap-x-10 gap-y-4 border-b border-border py-9 lg:grid-cols-[16rem_1fr_17rem]"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-on-tint">
                    {hub.tag}
                  </p>
                  <h3 className="mt-2 font-heading text-2xl leading-[1.15] text-foreground">
                    {hub.city}
                  </h3>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {hub.region}
                  </p>
                </div>

                <p className="max-w-xl text-base leading-[1.8] text-muted-foreground lg:pt-6">
                  {hub.role}
                </p>

                <div className="lg:pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
                    {hub.badge}
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-[1.7] text-muted-foreground">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                    <span>{hub.address}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4 — TIMELINE. A rail with year markers on dark, in place of
            four floating cards. Milestone headings are h3 now; they
            were h4 directly under the section h2.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-[#070F1C] py-20 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                  Eighteen-Year Trajectory
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-white">
                Evolution of Our Trade Infrastructure
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-white/70">
                From our origins as an independent Hong Kong trading firm to a comprehensive
                cross-border procurement and quality management network.
              </p>
            </motion.div>

            <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {milestones.map((m, idx) => (
                <li key={m.year} className="relative border-t border-white/15 pt-8">
                  <span className="absolute left-0 top-0 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-accent" />
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-3xl text-white">{m.year}</span>
                    <span className="font-mono text-xs tracking-[0.18em] text-accent-on-dark">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{m.title}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-white/70">{m.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            5 — CHARTER. A 2x2 hairline grid on white. The icon tiles
            and per-card borders are gone; icons sit inline.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-card py-20 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-tint">
                  Operational Standards
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
                Our Governance &amp; Trade Ethics Charter
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
                We eliminate the ambiguity and conflict of interest common among spot brokers and
                trading middlemen.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
              {governancePillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="bg-card px-8 py-9">
                    <Icon size={20} className="text-accent" />
                    <h3 className="mt-5 font-heading text-xl leading-[1.2] text-foreground">{p.title}</h3>
                    <p className="mt-3 max-w-lg text-sm leading-[1.7] text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            6 — CLOSING CTA. The short flat dark band used on the other
            routes. Was a rounded, shadowed card floating in its section.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#050E1A] py-20 lg:py-24">
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[600px] bg-[radial-gradient(ellipse,hsl(179_80%_27%/0.18)_0%,transparent_70%)] blur-[60px]" />

          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div
              {...reveal(reducedMotion)}
              className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-2xl">
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-px w-6 bg-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                    Direct Corporate Dialogue
                  </span>
                </div>
                <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-white">
                  {company.cta.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-[1.8] text-white/70">
                  {company.cta.text} Connect directly with our principals in Hong Kong or Shenzhen.
                  We begin every new commercial partnership with an open, technically disciplined
                  conversation.
                </p>
              </div>

              <Link
                to="/contact"
                className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_40px_hsl(179_80%_27%/0.35)]"
              >
                <span>{company.cta.button}</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
