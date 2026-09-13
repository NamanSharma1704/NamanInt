import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { mediaUrl } from '@/lib/media';
import ResponsiveImage from '@/components/ResponsiveImage';
import { ArrowRight } from 'lucide-react';
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
    image: mediaUrl('pages/categories/packaging-merchandising'),
    imageAlt: 'Sustainable retail packaging and branded display boxes',
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

export default function CategoriesPage() {
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/categories`;
  const reducedMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState(categoryFilters[0].id);

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

      <main className="overflow-hidden">
        {/* ═══════════════════════════════════════════════════════
            1 — HERO. A text-only dark banner, deliberately unlike the
            photographic heroes on home and trade services.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-primary py-20 sm:py-28 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_20%,hsl(179_80%_27%/0.10)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-accent/50 via-accent/15 to-transparent" />
          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              {/* Rule + caps, replacing the translucent pill badge. */}
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                  {categories.hero.eyebrow}
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-balance text-white sm:text-5xl lg:text-6xl">
                {categories.hero.title}
              </h1>
              <p className="mt-6 text-base leading-[1.8] text-white/70 sm:text-lg">
                {categories.hero.text} We coordinate manufacturing across audited tier-1 partner
                foundries and factories in Guangdong, Zhejiang, and Jiangsu, delivering direct
                factory pricing with Western institutional governance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-accent bg-accent text-sm tracking-wide text-white hover:bg-accent/90">
                    {categories.hero.cta}
                  </InteractiveHoverButton>
                </Link>
                <Link001
                  href="/trade-services"
                  className="flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                >
                  <span>View quality protocols &amp; governance</span>
                  <ArrowRight size={14} />
                </Link001>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — PROOF BAR. Already the hairline-divided band used across
            the site; unchanged apart from sourcing its data from an array.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <dl className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {proofStats.map((s) => (
                <div key={s.val} className="px-6 py-10 lg:px-10">
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
            3 — PORTFOLIO. One category at a time, chosen from the filter
            bar: a flat spread with the photograph beside its specification.

            This was five rounded, shadowed cards stacked in one 3,322px
            section, with bordered material chips nested inside every
            card — cards-in-cards, which DESIGN.md rules out — and an
            off-palette brown BorderBeam on the first.
        ═══════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-px w-8 bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-tint">
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
                  onClick={() => setSelectedFilter(tab.id)}
                  aria-pressed={isSelected}
                  aria-controls={`category-${tab.id}`}
                  className={`relative shrink-0 whitespace-nowrap pb-4 text-sm font-semibold transition-colors ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {isSelected && (
                    <motion.div
                      layoutId="category-filter-line"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
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
              return (
                <article key={item.id} id={`category-${item.id}`} hidden={!isSelected}>
                  <motion.div
                    initial={false}
                    animate={isSelected ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                    transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
                    className="grid items-center gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-14"
                  >
                    <figure className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ResponsiveImage
                        src={item.image}
                        alt={item.imageAlt}
                        width={1200}
                        height={900}
                        sizes="(min-width: 1024px) 38vw, 100vw"
                        loading={isDefault ? 'eager' : 'lazy'}
                        fetchPriority={isDefault ? 'high' : 'auto'}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </figure>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs tracking-[0.18em] text-accent-on-tint">
                          {item.number}
                        </span>
                        <div className="h-px w-6 bg-border" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {item.categoryTag}
                        </span>
                      </div>

                      <h3 className="mt-5 font-heading text-2xl leading-[1.15] text-balance text-foreground sm:text-3xl">
                        {item.title}
                      </h3>
                      <p className="mt-4 max-w-2xl text-base leading-[1.8] text-muted-foreground">
                        {item.description}
                      </p>

                      {/* Specification in two columns: grades and commercial
                          terms on the left, inspection protocols on the right.
                          Stacking all of it in one column had pushed this
                          section from 3,322px to 4,191px. */}
                      <div className="mt-8 grid gap-x-10 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Key material grades
                            </dt>
                            <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">
                              {item.materials.join(' · ')}
                            </dd>
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
                            {item.standards.map((std) => (
                              <li
                                key={std}
                                className="border-t border-border py-2 text-sm leading-[1.7] text-foreground first:border-t-0 first:pt-0"
                              >
                                {std}
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
            4 — GOVERNANCE. Four checkpoints as one hairline-divided
            rail on dark, in place of four separate bordered cards.
            Dark here so the long light catalogue above is framed by a
            dark close rather than running straight into the CTA.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-[#070F1C] py-20 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
                  {categories.note.label}
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-white">
                4-Stage Category Manufacturing Governance
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-white/70">
                Every manufacturing run is governed by four synchronized operational checkpoints
                before container seal sign-off.
              </p>
            </motion.div>

            <ol className="mt-12 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {governanceStages.map((stage) => (
                <li key={stage.num} className="bg-[#070F1C] px-7 py-8">
                  <span className="font-mono text-xs tracking-[0.18em] text-accent-on-dark">
                    {stage.num}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-white/70">{stage.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            5 — CLOSING CTA. The short flat band used on home and trade
            services, separated from the dark governance band above by a
            hairline. Was a rounded, shadowed card floating in a 723px
            section.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-t border-white/10 bg-[#050E1A] py-20 lg:py-24">
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
                    Direct Engineering Appraisal
                  </span>
                </div>
                <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-white">
                  {categories.cta.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-[1.8] text-white/70">
                  {categories.cta.text} Send us your engineering drawings, material specifications,
                  or seasonal merchandising briefs. Our Shenzhen and Hong Kong technical desks will
                  deliver a formal feasibility assessment within 1 business day.
                </p>
              </div>

              <Link
                to="/contact"
                className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_40px_hsl(179_80%_27%/0.35)]"
              >
                <span>{categories.cta.button}</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
