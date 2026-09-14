import { useEffect, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { ArrowRight, ClipboardCheck, Clock, Factory, Leaf, MapPin, PackageCheck, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { company } from 'virtual:content';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { AnimeCounter } from '@/components/ui/anime-counter';
import { followInPageLink } from '@/lib/in-page-link';

const title = 'Company Profile & Global Infrastructure | NAMAN INTERNATIONAL LTD';
const description =
  'Founded in Hong Kong in 2008, NAMAN INTERNATIONAL LTD operates four strategic hubs in Shenzhen, Hong Kong, California, and Manchester, coordinating high-volume trade with Western institutional governance.';

const hubs = [
  {
    id: 'shenzhen',
    desk: 'Shenzhen',
    timeZone: 'Asia/Shanghai',
    city: 'Shenzhen Hub',
    region: 'South China Production Epicenter',
    address: '6B65, 6th Floor, Sega Technology Park, Huaqiang North, Shenzhen',
    role: 'Active ground presence on factory assembly lines, tooling calibration, mold inspection, and daily production milestone tracking.',
    badge: 'Operations & Engineering',
    tag: 'Ground Zero',
  },
  {
    id: 'hong-kong',
    desk: 'Hong Kong',
    timeZone: 'Asia/Hong_Kong',
    city: 'Hong Kong SAR Hub',
    region: 'Global Trade & Finance Gateway',
    address: 'Unit 04–05, 16th Floor, The Broadway, No. 54–62 Lockhart Road, Wan Chai',
    role: 'Corporate headquarters, international trade finance, letters of credit (LC), free-port customs clearance, and global documentation.',
    badge: 'Corporate & Finance',
    tag: 'Headquarters',
  },
  {
    id: 'california',
    desk: 'California',
    timeZone: 'America/Los_Angeles',
    city: 'California Logistics Desk',
    region: 'North American Gateway',
    address: 'Richmond Ave, Fremont, CA 94536, USA',
    role: 'Port of Long Beach and Los Angeles drayage coordination, US West Coast customs clearance, and North American retail account management.',
    badge: 'Logistics & Client Relations',
    tag: 'Pacific Gateway',
  },
  {
    id: 'manchester',
    desk: 'Manchester',
    timeZone: 'Europe/London',
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
    icon: PackageCheck,
    title: 'Zero Component Substitution Guarantee',
    description: 'Every production batch strictly adheres to the approved golden prototype BOM. No unauthorized raw material or sub-component substitutions are permitted.',
  },
  {
    icon: Factory,
    title: 'Direct Tier-1 Factory Access',
    description: 'Complete commercial transparency. Our clients receive direct factory pricing without layered broker commissions or hidden margin markups.',
  },
  {
    icon: ClipboardCheck,
    title: 'Standardized Pre-Shipment Defect Ceilings',
    description: 'Strict AQL 1.5/2.5 General Inspection Level II standards enforced before factory gate release. Defective lots are reworked prior to bill of lading issuance.',
  },
  {
    icon: Leaf,
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

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * The current time, refreshed on each minute boundary. Null until mounted, so the server markup and the first client
 * render agree and the desk clocks fill in only in the browser.
 */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    let interval = 0;
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);
  return now;
}

function deskTime(date: Date, timeZone: string): { time: string; zone: string } {
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(date);
  const zone =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  return { time, zone };
}

export default function CompanyPage() {
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/company`;
  const reducedMotion = useReducedMotion();
  const now = useNow();

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

      <main className="overflow-clip">
        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Text-led. From lg the copy sits beside a raised
            panel of the four regional desks with each desk's local time;
            every row links to that office in the directory below.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background pb-28 pt-20 sm:pb-32 sm:pt-24 lg:pb-36 lg:pt-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,hsl(42_80%_55%/0.08)_0%,transparent_65%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-accent-on-tint/50 via-accent/40 to-transparent" />

          <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {company.hero.eyebrow}
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-balance text-foreground sm:text-5xl lg:text-6xl">
                {company.hero.title}
              </h1>
              <p className="mt-6 text-base leading-[1.8] text-muted-foreground sm:text-lg">
                {company.hero.text} Since 2008, NAMAN INTERNATIONAL LTD has served as the
                on-the-ground operational partner for North American retail brands and wholesale
                distributors, combining local Chinese manufacturing fluency with Western
                institutional governance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent bg-accent text-sm tracking-wide text-accent-foreground hover:bg-accent-hover shadow-teal">
                    {company.hero.cta}
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="/trade-services"
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>Inspect trade services</span>
                  <ArrowRight size={14} />
                </Link001>
              </div>
            </motion.div>

            <motion.nav {...reveal(reducedMotion)} aria-label="Regional desks" className="relative hidden lg:block">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.14),transparent)]" />
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_40px_80px_-44px_hsl(220_45%_15%/0.3)]">
                <div aria-hidden="true" className="h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />
                <div className="flex items-baseline justify-between border-b border-border px-7 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Regional desks</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Local time</p>
                </div>
                <ul className="divide-y divide-border">
                  {hubs.map((hub) => {
                    const local = now ? deskTime(now, hub.timeZone) : null;
                    return (
                      <li key={hub.id}>
                        <a
                          href={`#hub-${hub.id}`}
                          onClick={followInPageLink}
                          className="group flex items-center gap-4 px-7 py-4 transition-colors hover:bg-accent/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30">
                            <MapPin size={15} aria-hidden="true" className="text-accent-on-tint" />
                          </span>
                          <span className="flex-1">
                            <span className="block text-sm font-semibold text-foreground">{hub.desk}</span>
                            <span className="block text-xs text-muted-foreground">{hub.badge}</span>
                          </span>
                          <span className="text-right">
                            <span data-desk-time={hub.id} className="block font-mono text-sm tabular-nums text-foreground">
                              {local ? local.time : '--:--'}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">{local ? local.zone : ' '}</span>
                          </span>
                          <ArrowRight
                            size={15}
                            aria-hidden="true"
                            className="shrink-0 text-accent-on-tint transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                          />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.nav>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — FIGURES. A raised panel overlapping the hero's lower edge,
            as on trade services and categories. Each label precedes its
            figure in the markup and is shown beneath it.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative z-10 -mt-14 px-5 sm:px-8 lg:px-10">
          <dl className="mx-auto grid max-w-[1360px] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_28px_60px_-32px_hsl(220_45%_15%/0.28)] sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse bg-card px-5 py-7 sm:px-6 lg:px-9 lg:py-9">
                <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-heading text-2xl text-accent-on-tint sm:text-3xl">{s.val}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 — HUBS. An office directory: one ruled row per hub, reading
            across as place, role and address, inside a single raised
            panel. Each row is the target of a hero desk link.
        ═══════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 sm:px-8 lg:px-10 lg:pb-24 lg:pt-28">
          <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-px w-8 bg-gold" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
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

          <ul className="mt-12 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-[0_40px_80px_-48px_hsl(220_45%_15%/0.3)]">
            {hubs.map((hub, index) => (
              <li
                key={hub.city}
                id={`hub-${hub.id}`}
                tabIndex={-1}
                className="grid scroll-mt-28 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring gap-x-10 gap-y-4 px-6 py-8 sm:px-8 lg:grid-cols-[17rem_1fr_17rem] lg:px-10 lg:py-9"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-[0.14em] text-gold">{pad(index + 1)}</span>
                    <span aria-hidden="true" className="h-px w-5 bg-border" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{hub.tag}</p>
                  </div>
                  <h3 className="mt-3 font-heading text-2xl leading-[1.15] text-foreground">{hub.city}</h3>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {hub.region}
                  </p>
                </div>

                <p className="max-w-xl text-base leading-[1.8] text-muted-foreground lg:pt-7">{hub.role}</p>

                <div className="lg:pt-7">
                  <span className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-on-tint ring-1 ring-inset ring-accent/30">
                    {hub.badge}
                  </span>
                  <p className="mt-3 flex items-start gap-2 text-sm leading-[1.7] text-muted-foreground">
                    <MapPin size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-on-tint" />
                    <span>{hub.address}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4 — TIMELINE. One connected rail: vertical on phones and
            tablets, horizontal from lg, with a gold marker per milestone
            and the latest one marked current.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-y border-border bg-muted py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  Eighteen-Year Trajectory
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
                Evolution of Our Trade Infrastructure
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
                From our origins as an independent Hong Kong trading firm to a comprehensive
                cross-border procurement and quality management network.
              </p>
            </motion.div>

            <div className="relative mt-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-accent via-accent/60 to-gold/30 lg:bottom-auto lg:left-0 lg:right-0 lg:top-[7px] lg:h-px lg:w-auto lg:bg-gradient-to-r"
              />
              <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
                {milestones.map((m, idx) => {
                  const isCurrent = idx === milestones.length - 1;
                  return (
                    <motion.li key={m.year} {...reveal(reducedMotion)} className="relative pl-10 lg:pl-0 lg:pt-12">
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-2 h-[15px] w-[15px] rounded-full bg-accent ring-4 ring-muted lg:top-0"
                      />
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="font-heading text-3xl text-accent-on-tint">{m.year}</span>
                        <span className="font-mono text-xs tracking-[0.18em] text-gold">{pad(idx + 1)}</span>
                        {isCurrent && (
                          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-foreground">
                            Current
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-foreground">{m.title}</h3>
                      <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{m.description}</p>
                    </motion.li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            5 — CHARTER. Four raised cards, each led by a gold icon chip.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
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

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:gap-6">
              {governancePillars.map((p) => {
                const Icon = p.icon;
                return (
                  <motion.article
                    key={p.title}
                    {...reveal(reducedMotion)}
                    className="flex gap-5 rounded-2xl border border-border bg-card p-7 shadow-[0_24px_50px_-34px_hsl(220_45%_15%/0.3)] sm:p-8"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-inset ring-accent/30"
                    >
                      <Icon size={20} className="text-accent-on-tint" />
                    </span>
                    <div>
                      <h3 className="font-heading text-xl leading-[1.2] text-foreground">{p.title}</h3>
                      <p className="mt-3 max-w-lg text-sm leading-[1.7] text-muted-foreground">{p.description}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            6 — CLOSING CTA. The raised panel the other pages close on,
            with a bright-to-deep gold rule along its top edge and the
            reply facts beside the button.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-background pb-20 lg:pb-28">
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
                      Direct Corporate Dialogue
                    </span>
                  </div>
                  <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
                    {company.cta.title}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-[1.8] text-muted-foreground">
                    {company.cta.text} Connect directly with our principals in Hong Kong or Shenzhen.
                    We begin every new commercial partnership with an open, technically disciplined
                    conversation.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-6 lg:items-end">
                  <Link
                    to="/contact"
                    className="group inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-teal transition-all duration-300 hover:bg-accent-hover hover:shadow-teal-lg"
                  >
                    <span>{company.cta.button}</span>
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground lg:items-end">
                    <li className="flex items-center gap-2">
                      <Users size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Principals in Hong Kong and Shenzhen
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Reply within one business day
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
