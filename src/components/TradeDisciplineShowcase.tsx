import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router';
import ResponsiveImage from '@/components/ResponsiveImage';

interface Discipline {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  deliverables: string[];
  metric: string;
  metricLabel: string;
}

const disciplines: Discipline[] = [
  {
    id: 'sourcing',
    number: '01',
    title: 'Sourcing Direction & Factory Qualification',
    subtitle: 'Direct industrial discovery across Greater China',
    description:
      'We conduct on-site factory vetting across the Pearl River Delta. We verify production machinery, ethical labor compliance, material traceability, and capacity scheduling before placing commercial orders.',
    image: '/assets/images/sourcing-direction.jpg',
    imageAlt: 'Trade sourcing specialists reviewing material swatches and manufactured components',
    deliverables: [
      'Comprehensive 42-point factory audit and capacity dossier',
      'Raw material mill test and environmental compliance verification',
      'Direct tier-1 factory pricing with zero intermediary markups',
    ],
    metric: '180+',
    metricLabel: 'Audited Partner Factories',
  },
  {
    id: 'production',
    number: '02',
    title: 'Supplier Coordination & Tooling Oversight',
    subtitle: 'Active bilingual on-the-ground supervision',
    description:
      'Our coordinators maintain active presence on factory assembly lines. We supervise mold maintenance, tooling calibration, pre-production golden sample approvals, and milestone staging schedules.',
    image: '/assets/images/supplier-coordination.jpg',
    imageAlt: 'Supply chain manager and production engineer reviewing manufacturing specifications on assembly floor',
    deliverables: [
      'Pre-production golden prototype dimensional sign-off',
      'Weekly photographic and video production milestone logs',
      'Strict raw material intake and component substitution prevention',
    ],
    metric: '98.6%',
    metricLabel: 'On-Time Production Milestones',
  },
  {
    id: 'quality',
    number: '03',
    title: 'Forensic Quality Oversight & AQL 2.5',
    subtitle: 'ANSI/ASQ Z1.4 General Inspection Level II standard',
    description:
      'Zero containers leave the factory floor without verified quality sign-off. Our engineers inspect dimensional tolerances, barcode readability, drop resistance, and finish consistency under standardized protocols.',
    image: '/assets/images/quality-inspection.jpg',
    imageAlt: 'Quality assurance engineer conducting precision inspection on manufactured goods',
    deliverables: [
      'Formal ANSI/ASQ Z1.4 Level II pre-shipment inspection certificate',
      'Digital caliper, finish, and tensile tolerance measurements',
      'ISTA-1A export carton drop-test and retail barcode scan grading',
    ],
    metric: '<0.5%',
    metricLabel: 'Target Defect Ceiling',
  },
  {
    id: 'logistics',
    number: '04',
    title: 'Container Consolidation & Port Clearance',
    subtitle: 'Deepwater freight dispatch through Yantian & Shekou',
    description:
      'We maximize container cubic utilization, organize multi-vendor consolidation at our Shenzhen export hub, handle Chinese export customs clearance, and manage ocean bookings directly to North American ports.',
    image: '/assets/images/shipping-logistics.jpg',
    imageAlt: 'International container freight terminal and cargo vessel coordination',
    deliverables: [
      'Optimized 3D container packing plan (15–20% space savings)',
      'Chinese export customs declarations and HS code compliance',
      'Trans-Pacific ocean booking with end-to-end bill of lading tracking',
    ],
    metric: '14–18 Days',
    metricLabel: 'Pacific Transit to US West Coast',
  },
];

/** The part of a discipline title before the ampersand, used for the tab label. */
const shortTitle = (title: string): string => title.split('&')[0].trim();

export default function TradeDisciplineShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = disciplines[activeIndex];

  return (
    <section className="border-b border-border bg-card pb-20 pt-24 lg:pb-28 lg:pt-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-8 bg-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Core Disciplines</span>
          </div>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
            Considered oversight across the overseas supply chain.
          </h2>
          <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
            From industrial vetting in the Pearl River Delta to container receipt at North American distribution centers, our four operational disciplines guarantee complete quality and timeline control.
          </p>
        </div>

        {/* Underline tab bar */}
        <div className="mt-12 flex flex-wrap gap-x-7 gap-y-1 border-b border-border">
          {disciplines.map((item, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveIndex(idx)}
                className={`relative pb-4 pt-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-2 font-mono text-xs font-normal tracking-[0.12em] text-gold">{item.number}</span>
                <span>{shortTitle(item.title)}</span>
                {isSelected && (
                  <motion.div
                    layoutId="clean-tab-line"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-on-tint"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-12 grid grid-cols-1 items-stretch gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
          >
            <div className="flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{active.subtitle}</p>
              <h3 className="mt-3 font-heading text-2xl leading-[1.15] text-foreground sm:text-3xl lg:text-4xl">
                {active.title}
              </h3>
              <p className="mt-5 max-w-xl text-base leading-[1.8] text-muted-foreground">{active.description}</p>

              <div className="mt-8 flex items-baseline gap-3 border-y border-border py-5">
                <span className="shrink-0 whitespace-nowrap font-heading text-4xl text-accent-on-tint sm:text-5xl">
                  {active.metric}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {active.metricLabel}
                </span>
              </div>

              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Verified deliverables
              </p>
              <ul className="mt-4 space-y-3.5">
                {active.deliverables.map((deliv) => (
                  <li key={deliv} className="flex items-start gap-3 text-sm leading-[1.7] text-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30"
                    >
                      <Check size={12} strokeWidth={2.75} className="text-accent-on-tint" />
                    </span>
                    {deliv}
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="group mt-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent-on-tint transition-colors hover:text-foreground"
              >
                <span>Inquire about this discipline</span>
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Raised photograph, the stage treatment the homepage services sequence uses, with nothing laid over it:
                the tab and the heading beside it already name the discipline. */}
            <figure className="relative min-h-[22rem] overflow-hidden rounded-2xl bg-muted shadow-[0_32px_64px_-32px_hsl(220_45%_15%/0.35)] ring-1 ring-border/70">
              <ResponsiveImage
                src={active.image}
                alt={active.imageAlt}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            </figure>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
