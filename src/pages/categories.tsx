import { useState, type FocusEvent } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import ResponsiveImage from '@/components/ResponsiveImage';
import HousingInspection from '@/components/housing-inspection/HousingInspection';
import { useInspectionDrawingAvailable } from '@/lib/housing-inspection/capability';
import { useInspectionView } from '@/lib/housing-inspection/use-inspection-view';
import { ArrowRight, Check, Clock, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { categories } from 'virtual:content';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';

const title = 'Product Categories & Manufacturing Capabilities | NAMAN INTERNATIONAL LTD';
const description =
  'Explore NAMAN INTERNATIONAL LTD manufacturing portfolio: precision hardware & castings, consumer packaging, technical textiles, home living, and seasonal retail programs.';

interface CategoryItem {
  id: string;
  number: string;
  categoryTag: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  materials: string[];
  standards: string[];
  leadTime: string;
  volumeProfile: string;
  contactParam: string;
}

const portfolioCategories: CategoryItem[] = [
  {
    id: 'hardware',
    number: '01',
    categoryTag: 'Precision Hardware & Castings',
    title: 'Precision Die-Castings, CNC & Engineering Hardware',
    description:
      'High-tolerance mechanical parts, die-cast aluminum enclosures, brass fittings, and custom fabricated assemblies manufactured across tier-1 partner foundries in Guangdong and Zhejiang.',
    image: '/assets/images/category-precision-hardware.jpg',
    imageAlt: 'Precision CNC machined aluminum components and cast housings on factory inspection table',
    materials: ['ADC12 Aluminum', 'A380 Alloy', '6061-T6', 'C3604 Brass', '304 Stainless'],
    standards: ['CMM 3D Coordinate inspection (±0.05mm)', 'RoHS & REACH compliance', 'Salt spray 96h corrosion test'],
    leadTime: '30–45 Days (Tooling + Production)',
    volumeProfile: 'FCL / High-Precision LCL Batches',
    contactParam: 'hardware',
  },
  {
    id: 'packaging',
    number: '02',
    categoryTag: 'Packaging & Merchandising',
    title: 'Consumer Retail Packaging, Rigid Boxes & Displays',
    description:
      'Custom shelf-ready packaging, high-grade rigid gift boxes, corrugated master cartons, and point-of-sale displays engineered to meet stringent North American retail store manuals.',
    image: '/assets/images/category-consumer-retail-packaging.jpg',
    imageAlt: 'Rigid gift boxes, folding cartons, counter displays and corrugated shipping cartons on a two-tier retail display table',
    materials: ['FSC-Certified SBS Paperboard', 'Recycled Greyboard', 'E/B Flute Corrugated', 'Molded Pulp'],
    standards: ['ISTA-3A Drop & transit testing', 'Edge Crush Test (ECT) verified', 'GS1 / UPC barcode readability scan'],
    leadTime: '20–30 Days',
    volumeProfile: 'Multi-SKU Consolidated Master Packs',
    contactParam: 'packaging',
  },
  {
    id: 'textiles',
    number: '03',
    categoryTag: 'Textiles & Materials',
    title: 'Technical Textiles, Woven Materials & Soft Goods',
    description:
      'Fabrication-focused sourcing for home textiles, commercial soft goods, and private-label retail collections with strict mill control over yarn density, dye fastness, and hand-feel.',
    image: mediaUrl('pages/categories/textiles-materials'),
    imageAlt: 'Premium natural textiles and material fabrications on design desk',
    materials: ['Long-Staple Combed Cotton', 'Recycled RPET Polyester', 'Linen Blends', 'Performance Canvas'],
    standards: ['OEKO-TEX Standard 100 certification', 'AATCC 8/116 Color Fastness', 'Tensile tear resistance pass'],
    leadTime: '35–45 Days',
    volumeProfile: 'Seasonal Container Runs',
    contactParam: 'textiles',
  },
  {
    id: 'home',
    number: '04',
    categoryTag: 'Home & Living Utility',
    title: 'Everyday Homewares, Tabletop & Kitchen Utility',
    description:
      'Considered home product lines combining aesthetic restraint with commercial durability. From borosilicate kitchenware to bamboo accessories, shaped to retail buyer margins.',
    image: mediaUrl('pages/categories/home-living'),
    imageAlt: 'Everyday tabletop and homewares utility goods',
    materials: ['High-Borosilicate Glass', 'Glazed Ceramic', '18/10 Stainless Steel', 'FSC Acacia & Bamboo'],
    standards: ['FDA 21 CFR Food Contact safe', 'LFGB German Food Standard pass', 'Thermal shock & dishwasher tested'],
    leadTime: '25–40 Days',
    volumeProfile: 'FCL Palletized Container Freight',
    contactParam: 'home',
  },
  {
    id: 'seasonal',
    number: '05',
    categoryTag: 'Seasonal & Promotional',
    title: 'Seasonal Retail Programs & Time-Sensitive Promotions',
    description:
      'Synchronized manufacturing schedules structured around fixed retail catalog releases, holiday promotional deadlines, and guaranteed cross-dock dispatch windows.',
    image: mediaUrl('pages/categories/seasonal-promotional'),
    imageAlt: 'Seasonal retail goods and promotional merchandise',
    materials: ['Multi-Material Assemblies', 'Decorative Tinplate', 'Custom Molded Polymers', 'Gift Packaging'],
    standards: ['Guaranteed drop-dead shipping window', 'AQL 2.5 Major / 4.0 Minor inspection', 'Pre-cartoned retail packaging'],
    leadTime: '30–60 Days (Strict Calendar Staging)',
    volumeProfile: 'Direct Regional DC Drop Shipping',
    contactParam: 'seasonal',
  },
];

const categoryFilters = [
  { id: 'hardware', label: 'Precision Hardware' },
  { id: 'packaging', label: 'Packaging & Retail' },
  { id: 'textiles', label: 'Textiles & Materials' },
  { id: 'home', label: 'Home & Utility' },
  { id: 'seasonal', label: 'Seasonal Programs' },
];

const proofStats = [
  { val: '±0.05mm', label: 'CMM Precision Tolerance' },
  { val: 'AQL 1.5/2.5', label: 'Standardized Sampling Level' },
  { val: 'ISTA-3A', label: 'Transit Packaging Drop Tested' },
  { val: '100% SLA', label: 'Raw Material Mill Pass' },
];

const governanceStages = [
  {
    num: '01',
    title: 'Raw Material Mill Analysis',
    text: 'Chemical composition testing, alloy verification, and environmental compliance (RoHS/REACH) before production begins.',
  },
  {
    num: '02',
    title: 'Tooling & In-Line Staging',
    text: 'Golden prototype dimensional sign-off, mold wear monitoring, and first-off inspection on the assembly floor.',
  },
  {
    num: '03',
    title: 'Forensic AQL 1.5/2.5 Audit',
    text: 'ANSI/ASQ Z1.4 General Inspection Level II defect sampling with high-resolution photographic audit logs.',
  },
  {
    num: '04',
    title: 'ISTA Transit Drop & Barcode',
    text: 'Master carton drop tests, 100% GS1/UPC barcode scan verification, and container desiccants moisture protection.',
  },
];

const reveal = (reduced: boolean | null) => ({
  initial: { opacity: 0, y: reduced ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduced ? 0 : 0.45, ease: 'easeOut' as const },
});

/** "30–45 Days (Tooling + Production)" becomes "30–45 Days" for the hero index. */
const shortLeadTime = (leadTime: string): string => leadTime.split(' (')[0];

/** Keyboard focus previews an inspection point; focus that follows a tap does not. */
function isKeyboardFocus(event: FocusEvent<HTMLElement>): boolean {
  try {
    return event.currentTarget.matches(':focus-visible');
  } catch {
    return true;
  }
}

function CheckChip() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30"
    >
      <Check size={12} strokeWidth={2.75} className="text-accent-on-tint" />
    </span>
  );
}

export default function CategoriesPage() {
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/categories`;
  const reducedMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState(categoryFilters[0].id);
  // Precision Hardware's figure can switch from its photograph to an inspection drawing of the
  // housing in it. The switch only appears once the browser has confirmed capable WebGL.
  const inspectionAvailable = useInspectionDrawingAvailable();
  const inspection = useInspectionView();

  const selectCategory = (id: string): void => {
    // Leaving a category returns its figure to the photograph, which also releases the drawing's WebGL context
    // rather than keeping it in a hidden panel.
    if (id !== selectedFilter) inspection.showPhotograph();
    setSelectedFilter(id);
  };

  /** From the hero index: show the category, then bring the portfolio section into view. */
  const openPortfolio = (id: string): void => {
    selectCategory(id);
    document.getElementById('portfolios')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

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
        <meta property="og:image" content={`${siteUrl}/assets/images/category-precision-hardware.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/category-precision-hardware.jpg`} />
      </Helmet>

      <main className="overflow-clip">
        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Text-led rather than photographic, so it is not a
            third copy of the home and trade services heroes. From lg the
            copy sits beside a raised index of the five portfolios, and
            each row opens its category in the section below.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background pb-28 pt-20 sm:pb-32 sm:pt-24 lg:pb-36 lg:pt-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_20%,hsl(42_80%_55%/0.07)_0%,transparent_60%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-accent-on-tint/50 via-accent/40 to-transparent" />

          <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {categories.hero.eyebrow}
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-balance text-foreground sm:text-5xl lg:text-6xl">
                {categories.hero.title}
              </h1>
              <p className="mt-6 text-base leading-[1.8] text-muted-foreground sm:text-lg">
                {categories.hero.text} We coordinate manufacturing across audited tier-1 partner
                foundries and factories in Guangdong, Zhejiang, and Jiangsu, delivering direct
                factory pricing with Western institutional governance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent bg-accent text-sm tracking-wide text-accent-foreground hover:bg-accent-hover shadow-teal">
                    {categories.hero.cta}
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="/trade-services"
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>View quality protocols &amp; governance</span>
                  <ArrowRight size={14} />
                </Link001>
              </div>
            </motion.div>

            <motion.nav {...reveal(reducedMotion)} aria-label="Manufacturing portfolios" className="relative hidden lg:block">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.14),transparent)]" />
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_40px_80px_-44px_hsl(220_45%_15%/0.3)]">
                <div aria-hidden="true" className="h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />
                <div className="flex items-baseline justify-between border-b border-border px-7 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Manufacturing portfolios</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lead time</p>
                </div>
                <ul className="divide-y divide-border">
                  {portfolioCategories.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openPortfolio(item.id)}
                        className="group flex w-full items-center gap-4 px-7 py-4 text-left transition-colors hover:bg-accent/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="font-mono text-xs tracking-[0.14em] text-gold">{item.number}</span>
                        <span className="flex-1 text-sm font-semibold text-foreground">{item.categoryTag}</span>
                        <span className="text-xs text-muted-foreground">{shortLeadTime(item.leadTime)}</span>
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                          className="shrink-0 text-accent-on-tint transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.nav>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — PROOF FIGURES. A raised panel overlapping the hero's lower
            edge, as on trade services. Each label precedes its figure in
            the markup and is shown beneath it.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative z-10 -mt-14 px-5 sm:px-8 lg:px-10">
          <dl className="mx-auto grid max-w-[1360px] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_28px_60px_-32px_hsl(220_45%_15%/0.28)] sm:grid-cols-4">
            {proofStats.map((s) => (
              <div key={s.val} className="flex flex-col-reverse bg-card px-5 py-7 sm:px-6 lg:px-9 lg:py-9">
                <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-heading text-2xl text-accent-on-tint sm:text-3xl">{s.val}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 — PORTFOLIO. One category at a time, chosen from the filter
            bar or the hero index: the photograph on a raised stage beside
            its specification.
        ═══════════════════════════════════════════════════════ */}
        <section id="portfolios" className="mx-auto max-w-[1440px] scroll-mt-20 px-5 pb-20 pt-24 sm:px-8 lg:px-10 lg:pb-24 lg:pt-28">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-px w-8 bg-gold" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                {categories.intro.eyebrow}
              </span>
            </div>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
              Manufacturing Portfolios
            </h2>
          </div>

          {/* Underline filter bar, matching the discipline tabs on trade
              services. Scrolls sideways inside itself on narrow screens
              rather than wrapping into a ragged second line. */}
          <div className="mt-10 flex gap-6 overflow-x-auto border-b border-border sm:gap-8">
            {categoryFilters.map((tab) => {
              const isSelected = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectCategory(tab.id)}
                  aria-pressed={isSelected}
                  aria-controls={`category-${tab.id}`}
                  className={`relative shrink-0 whitespace-nowrap pb-4 pt-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {isSelected && (
                    <motion.div
                      layoutId="category-filter-line"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent-on-tint"
                      transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* All five categories are rendered, so every one reaches the
              server HTML and search engines; unselected ones carry the
              hidden attribute. The article has no display utility of its
              own because one (grid) would override [hidden]. Lazy images
              in hidden panels don't load until their panel is shown. */}
          <div>
            {portfolioCategories.map((item) => {
              const isSelected = item.id === selectedFilter;
              const isDefault = item.id === categoryFilters[0].id;
              const offersInspection = item.id === 'hardware' && inspectionAvailable;
              const inspecting = offersInspection && inspection.on;
              return (
                <article key={item.id} id={`category-${item.id}`} hidden={!isSelected}>
                  <motion.div
                    initial={false}
                    animate={isSelected ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                    transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
                    className="grid items-center gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-14"
                  >
                    <div>
                      <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-[0_32px_64px_-32px_hsl(220_45%_15%/0.35)] ring-1 ring-border/70">
                        <ResponsiveImage
                          src={item.image}
                          alt={item.imageAlt}
                          width={1200}
                          height={900}
                          sizes="(min-width: 1024px) 38vw, 100vw"
                          loading={isDefault ? 'eager' : 'lazy'}
                          fetchPriority={isDefault ? 'high' : 'auto'}
                          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                            inspecting && inspection.ready ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        {inspecting && (
                          <HousingInspection
                            protocols={item.standards}
                            highlight={inspection.highlight}
                            onReady={inspection.markReady}
                            onFailed={inspection.showPhotograph}
                          />
                        )}
                      </figure>

                      {/* Underline switch, matching the category filter bar above. The
                          photograph stays the default; the drawing loads on request. */}
                      {offersInspection && (
                        <div role="group" aria-label="Figure view" className="mt-4 flex gap-6 border-b border-border">
                          {[
                            { drawing: false, label: 'Photograph' },
                            { drawing: true, label: 'Inspection drawing' },
                          ].map((option) => {
                            const selected = inspection.on === option.drawing;
                            return (
                              <button
                                key={option.label}
                                type="button"
                                aria-pressed={selected}
                                onClick={option.drawing ? inspection.showDrawing : inspection.showPhotograph}
                                className={`relative pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {option.label}
                                {selected && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-on-tint" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs tracking-[0.18em] text-gold">{item.number}</span>
                        <div className="h-px w-6 bg-border" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {item.categoryTag}
                        </span>
                      </div>

                      <h3 className="mt-5 font-heading text-2xl leading-[1.15] text-balance text-foreground sm:text-3xl">
                        {item.title}
                      </h3>
                      <p className="mt-4 max-w-2xl text-base leading-[1.8] text-muted-foreground">{item.description}</p>

                      {/* Specification in a soft ivory block: grades and commercial terms on the left, inspection
                          protocols on the right. The page section is not a card, so this is the only box. */}
                      <div className="mt-8 grid gap-x-10 gap-y-6 rounded-2xl border border-border bg-muted p-6 sm:grid-cols-2 sm:p-7">
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Key material grades
                            </dt>
                            <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">{item.materials.join(' · ')}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Lead time
                            </dt>
                            <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">{item.leadTime}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Volume profile
                            </dt>
                            <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">{item.volumeProfile}</dd>
                          </div>
                        </dl>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Inspection protocols
                          </p>
                          <ul className="mt-1.5">
                            {item.standards.map((std, index) => (
                              <li
                                key={std}
                                className="border-t border-border py-2.5 text-sm leading-[1.7] text-foreground first:border-t-0 first:pt-1"
                              >
                                {inspecting ? (
                                  // In the inspection view each protocol controls its numbered
                                  // point: mouse hover or keyboard focus previews it, a press pins it.
                                  <button
                                    type="button"
                                    aria-pressed={inspection.pinned === index}
                                    onClick={() => inspection.togglePin(index)}
                                    onPointerEnter={(event) => {
                                      if (event.pointerType === 'mouse') inspection.preview(index);
                                    }}
                                    onPointerLeave={(event) => {
                                      if (event.pointerType === 'mouse') inspection.preview(null);
                                    }}
                                    onFocus={(event) => {
                                      if (isKeyboardFocus(event)) inspection.preview(index);
                                    }}
                                    onBlur={() => inspection.preview(null)}
                                    className={`flex w-full items-baseline gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                      inspection.highlight === index ? 'text-accent-on-tint' : 'hover:text-accent-on-tint'
                                    }`}
                                  >
                                    <span className="font-mono text-xs text-gold">{index + 1}</span>
                                    <span>{std}</span>
                                  </button>
                                ) : (
                                  <span className="flex items-start gap-2.5">
                                    <CheckChip />
                                    <span>{std}</span>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Link
                        to={`/contact?category=${item.contactParam}`}
                        className="group mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent-on-tint transition-colors hover:text-foreground"
                      >
                        <span>Inquire for this category</span>
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </motion.div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4 — GOVERNANCE. Four checkpoints as raised white cards on the
            ivory band, each numbered on a gold badge.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-y border-border bg-muted py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {categories.note.label}
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
                4-Stage Category Manufacturing Governance
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
                Every manufacturing run is governed by four synchronized operational checkpoints
                before container seal sign-off.
              </p>
            </motion.div>

            <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {governanceStages.map((stage) => (
                <motion.li
                  key={stage.num}
                  {...reveal(reducedMotion)}
                  className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-[0_24px_50px_-34px_hsl(220_45%_15%/0.3)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-mono text-sm font-bold text-accent-foreground shadow-teal">
                    {stage.num}
                  </span>
                  <h3 className="mt-6 text-base font-semibold text-foreground">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{stage.text}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            5 — CLOSING CTA. The raised panel home and trade services close
            on, with a bright-to-deep gold rule along its top edge and the
            appraisal facts beside the button.
        ═══════════════════════════════════════════════════════ */}
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
                      Direct Engineering Appraisal
                    </span>
                  </div>
                  <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
                    {categories.cta.title}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-[1.8] text-muted-foreground">
                    {categories.cta.text} Send us your engineering drawings, material specifications,
                    or seasonal merchandising briefs. Our Shenzhen and Hong Kong technical desks will
                    deliver a formal feasibility assessment within 1 business day.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-6 lg:items-end">
                  <Link
                    to="/contact"
                    className="group inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-teal transition-all duration-300 hover:bg-accent-hover hover:shadow-teal-lg"
                  >
                    <span>{categories.cta.button}</span>
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground lg:items-end">
                    <li className="flex items-center gap-2">
                      <Clock size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Feasibility assessment within one business day
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      Technical desks in Shenzhen and Hong Kong
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
