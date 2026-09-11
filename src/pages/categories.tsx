import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowRight, CheckCircle2, SlidersHorizontal, Layers, FileCheck, CalendarClock, Box } from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { categories } from 'virtual:content';
import { BorderBeam } from '@/components/ui/border-beam';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

const siteUrl = 'https://nevba9hqli.preview.c35.airoapp.ai';
const url = `${siteUrl}/categories`;
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
    image: '/airo-assets/images/pages/categories/packaging-merchandising',
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
    image: '/airo-assets/images/pages/categories/textiles-materials',
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
    image: '/airo-assets/images/pages/categories/home-living',
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
    image: '/airo-assets/images/pages/categories/seasonal-promotional',
    imageAlt: 'Seasonal retail goods and promotional merchandise',
    materials: ['Multi-Material Assemblies', 'Decorative Tinplate', 'Custom Molded Polymers', 'Gift Packaging'],
    standards: ['Guaranteed drop-dead shipping window', 'AQL 2.5 Major / 4.0 Minor inspection', 'Pre-cartoned retail packaging'],
    leadTime: '30–60 Days (Strict Calendar Staging)',
    volumeProfile: 'Direct Regional DC Drop Shipping',
    contactParam: 'seasonal',
  },
];

const categoryFilters = [
  { id: 'all', label: 'All Categories' },
  { id: 'hardware', label: 'Precision Hardware' },
  { id: 'packaging', label: 'Packaging & Retail' },
  { id: 'textiles', label: 'Textiles & Materials' },
  { id: 'home', label: 'Home & Utility' },
  { id: 'seasonal', label: 'Seasonal Programs' },
];

const reveal = (reduced: boolean | null) => ({
  initial: { opacity: 0, y: reduced ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduced ? 0 : 0.45, ease: 'easeOut' as const },
});

export default function CategoriesPage() {
  const reducedMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredCategories =
    selectedFilter === 'all'
      ? portfolioCategories
      : portfolioCategories.filter((c) => c.id === selectedFilter);

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
        {/* 1. Category Hero — Dark Banner */}
        <section className="relative overflow-hidden bg-primary py-20 sm:py-28 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_20%,hsl(179_80%_27%/0.10)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute top-0 left-0 h-px w-full bg-gradient-to-r from-accent/50 via-accent/15 to-transparent" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal(reducedMotion)} className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {categories.hero.eyebrow}
                </span>
              </div>
              <h1 className="mt-7 font-heading text-4xl leading-[1.06] text-white sm:text-5xl lg:text-6xl">
                {categories.hero.title}
              </h1>
              <p className="mt-6 text-base leading-[1.75] text-white/65 sm:text-lg">
                {categories.hero.text} We coordinate manufacturing across audited tier-1 partner foundries and factories in Guangdong, Zhejiang, and Jiangsu—delivering direct factory pricing with Western institutional governance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-teal-lg transition-all duration-200 hover:bg-accent/90"
                >
                  <span>{categories.hero.cta}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/trade-services"
                  className="text-sm font-semibold text-white/70 transition-colors hover:text-accent"
                >
                  View quality protocols & governance →
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. Technical Standard Proof Bar */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {[
                { val: '±0.05mm', label: 'CMM Precision Tolerance' },
                { val: 'AQL 1.5/2.5', label: 'Standardized Sampling Level' },
                { val: 'ISTA-3A', label: 'Transit Packaging Drop Tested' },
                { val: '100% SLA', label: 'Raw Material Mill Pass' },
              ].map((s) => (
                <div key={s.val} className="px-6 py-10 lg:px-10">
                  <p className="font-heading text-2xl font-bold text-accent sm:text-3xl">{s.val}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Interactive Category Filter & Portfolio Grid */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {categories.intro.eyebrow}
              </p>
              <h2 className="mt-2 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl">
                Manufacturing Portfolios
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:flex">
                <SlidersHorizontal size={14} /> Filter:
              </span>
              {categoryFilters.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                    selectedFilter === tab.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="mt-14 space-y-16">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((item, index) => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="relative grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[1.1fr_1.4fr] shadow-xs"
                >
                  {index === 0 && (
                    <BorderBeam size={280} duration={14} colorFrom="#8B4513" colorTo="#2a4365" borderWidth={1.5} />
                  )}
                  {/* Photo Side */}
                  <figure className="relative min-h-[300px] lg:min-h-full overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      width={1200}
                      height={900}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 rounded-md bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground backdrop-blur-xs">
                      {item.number} / {item.categoryTag}
                    </div>
                  </figure>

                  {/* Content & Engineering Specifications */}
                  <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
                    <div>
                      <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>

                      {/* Technical Specs Breakdown */}
                      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                            <Layers size={14} /> Key Material Grades
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.materials.map((mat) => (
                              <span
                                key={mat}
                                className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                              >
                                {mat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                            <FileCheck size={14} /> Inspection Protocols
                          </div>
                          <ul className="mt-2 space-y-1">
                            {item.standards.map((std) => (
                              <li key={std} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 size={13} className="text-accent shrink-0 mt-0.5" />
                                <span>{std}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Production Parameters Strip */}
                      <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarClock size={14} className="text-accent" />
                          <span><strong>Lead Time:</strong> {item.leadTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Box size={14} className="text-accent" />
                          <span><strong>Volume Profile:</strong> {item.volumeProfile}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4">
                      <Link
                        to={`/contact?category=${item.contactParam}`}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold tracking-[0.06em] text-primary-foreground shadow-xs transition-colors hover:bg-accent"
                      >
                        <span>Inquire For This Category</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* 4. Quality & Compliance Assurance Protocol Strip (Inspired by Transpoco) */}
        <section className="border-y border-border bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {categories.note.label}
              </p>
              <h2 className="mt-3 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl">
                4-Stage Category Manufacturing Governance
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Every manufacturing run is governed by four synchronized operational checkpoints before container seal sign-off.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                <span className="font-heading text-2xl font-bold text-accent">01</span>
                <h4 className="mt-3 text-base font-bold text-foreground">Raw Material Mill Analysis</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Chemical composition testing, alloy verification, and environmental compliance (RoHS/REACH) before production begins.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                <span className="font-heading text-2xl font-bold text-accent">02</span>
                <h4 className="mt-3 text-base font-bold text-foreground">Tooling & In-Line Staging</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Golden prototype dimensional sign-off, mold wear monitoring, and first-off inspection on the assembly floor.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                <span className="font-heading text-2xl font-bold text-accent">03</span>
                <h4 className="mt-3 text-base font-bold text-foreground">Forensic AQL 1.5/2.5 Audit</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  ANSI/ASQ Z1.4 General Inspection Level II defect sampling with high-resolution photographic audit logs.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                <span className="font-heading text-2xl font-bold text-accent">04</span>
                <h4 className="mt-3 text-base font-bold text-foreground">ISTA Transit Drop & Barcode</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Master carton drop tests, 100% GS1/UPC barcode scan verification, and container desiccants moisture protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Direct Technical RFQ Callout */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <motion.div
            {...reveal(reducedMotion)}
            className="rounded-2xl bg-primary px-8 py-14 sm:px-12 lg:px-16 lg:py-20 shadow-md"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Direct Engineering Appraisal
              </p>
              <h2 className="mt-4 font-heading text-3xl leading-[1.1] text-primary-foreground sm:text-4xl lg:text-5xl">
                {categories.cta.title}
              </h2>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-primary-foreground/80">
                {categories.cta.text} Send us your engineering drawings, material specifications, or seasonal merchandising briefs. Our Shenzhen and Hong Kong technical desks will deliver a formal feasibility assessment within 1 business day.
              </p>
              <div className="mt-8">
                <Link to="/contact">
                  <InteractiveHoverButton className="border-border/80 bg-accent text-accent-foreground hover:bg-secondary text-sm tracking-wide">
                    {categories.cta.button}
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
