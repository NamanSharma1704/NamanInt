import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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

export default function TradeDisciplineShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = disciplines[activeIndex];

  return (
    <section className="border-b border-border bg-card py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Core Disciplines
          </p>
          <h2 className="mt-3 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl lg:text-5xl">
            Considered oversight across the overseas supply chain.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            From industrial vetting in the Pearl River Delta to container receipt at North American distribution centers, our four operational disciplines guarantee complete quality and timeline control.
          </p>
        </div>

        {/* Minimalist Underline Tab Bar */}
        <div className="mt-12 flex flex-wrap gap-2 border-b border-border pb-px sm:gap-6">
          {disciplines.map((item, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative pb-4 text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-2 text-xs font-bold text-accent">{item.number}</span>
                <span>{item.title.split('&')[0]}</span>
                {isSelected && (
                  <motion.div
                    layoutId="clean-tab-line"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Discipline Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-12 grid grid-cols-1 items-stretch gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16"
          >
            {/* Left Content */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  {active.subtitle}
                </p>
                <h3 className="mt-2 font-heading text-2xl sm:text-3xl lg:text-4xl text-foreground leading-[1.15]">
                  {active.title}
                </h3>
              </div>

              <p className="text-base leading-relaxed text-muted-foreground max-w-xl">
                {active.description}
              </p>

              {/* Clean Metric Callout */}
              <div className="flex items-baseline gap-3 border-y border-border py-4">
                <span className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  {active.metric}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {active.metricLabel}
                </span>
              </div>

              {/* Hairline-divided list, matching the deliverable lists used on
                  the homepage. Was a bulleted list with a tinted circle icon
                  per row. */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Verified deliverables
                </p>
                <ul className="mt-3">
                  {active.deliverables.map((deliv) => (
                    <li
                      key={deliv}
                      className="border-t border-border py-3.5 text-sm leading-[1.7] text-foreground"
                    >
                      {deliv}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                >
                  <span>Inquire about this discipline</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Flat photograph, no radius, border or shadow, filling the column
                height rather than sitting in a framed card. */}
            <div className="relative min-h-[22rem] overflow-hidden">
              <ResponsiveImage
                src={active.image}
                alt={active.imageAlt}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
