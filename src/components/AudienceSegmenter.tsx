import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export type AudienceType = 'retail' | 'wholesale';

interface AudienceData {
  id: AudienceType;
  label: string;
  icon: typeof Store;
  tagline: string;
  title: string;
  description: string;
  benefits: Array<{ title: string; desc: string }>;
  metric: { value: string; label: string };
  ctaText: string;
  ctaHref: string;
}

const audienceData: Record<AudienceType, AudienceData> = {
  retail: {
    id: 'retail',
    label: 'Retail Brands & Chains',
    icon: Store,
    tagline: 'Consumer-facing brands',
    title: 'Precision sourcing built for consumer retail compliance.',
    description:
      'We support North American retail brands with considered overseas procurement, spanning barcode compliance, retail packaging, strict defect tolerances, and scheduled container drops.',
    benefits: [
      {
        title: 'Shelf-Ready Packaging & Barcoding',
        desc: 'Custom hangtags, UPC/GS1 barcoding, retail master cartons, and inner-pack specifications aligned with major North American retailer manuals.',
      },
      {
        title: 'AQL 2.5 Pre-Shipment Quality Protocol',
        desc: 'Multi-point in-line and final carton inspections ensuring functional reliability and finish consistency before factory gate release.',
      },
      {
        title: 'Scheduled Cadence Replenishment',
        desc: 'Synchronized manufacturing schedules structured around retail seasonal buying cycles and promotional inventory deadlines.',
      },
    ],
    metric: { value: '<0.5%', label: 'Target defect ceiling on finished goods' },
    ctaText: 'Discuss Retail Sourcing Program',
    ctaHref: '/contact?segment=retail',
  },
  wholesale: {
    id: 'wholesale',
    label: 'Wholesale Importers & Distributors',
    icon: Building2,
    tagline: 'High-volume trade operations',
    title: 'Scale and margin efficiency for high-volume trade.',
    description:
      'Engineered for wholesale buyers and commercial distributors who require competitive tier-1 factory pricing, container space maximization, and seamless port-to-warehouse multi-modal transit.',
    benefits: [
      {
        title: 'Tier-1 Direct Factory Negotiation',
        desc: 'Direct commercial negotiations with verified manufacturing partners across Guangdong, Zhejiang, and Jiangsu without broker markups.',
      },
      {
        title: 'Full Container Load (FCL) Optimization',
        desc: 'Cubic meter optimization, pallet load engineering, and consolidated freight planning to minimize landed unit freight costs.',
      },
      {
        title: 'Cross-Border Documentation & Customs',
        desc: 'Accurate commercial invoices, packing lists, certificates of origin, and coordinated customs clearing through US West and East Coast ports.',
      },
    ],
    metric: { value: '15–22%', label: 'Average landed cost optimization vs spot brokers' },
    ctaText: 'Discuss Wholesale Volume Program',
    ctaHref: '/contact?segment=wholesale',
  },
};

export default function AudienceSegmenter() {
  const [activeTab, setActiveTab] = useState<AudienceType>('retail');
  const activeData = audienceData[activeTab];
  const InactiveData = audienceData[activeTab === 'retail' ? 'wholesale' : 'retail'];

  return (
    <section className="relative overflow-hidden bg-[#060C18] py-28 lg:py-36">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(hsl(179 80% 60% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(179 80% 60% / 0.6) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />
      {/* Teal radial bloom */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-[600px] w-[400px] -translate-y-1/2 bg-[radial-gradient(ellipse,hsl(179_80%_27%/0.14)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">

        {/* Section Header */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-8 bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-on-dark">Commercial Pathways</span>
            </div>
            <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-white">
              Who are you sourcing for?
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-[1.8] text-white/70 lg:text-right">
            Select your commercial profile to inspect tailored operational protocols, compliance standards, and logistics models.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="mb-12 flex items-center gap-1 rounded-xl border border-white/8 bg-white/4 p-1 w-fit">
          {(['retail', 'wholesale'] as const).map((type) => {
            const d = audienceData[type];
            const Icon = d.icon;
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-250 ${
                  activeTab === type
                    ? 'bg-accent text-white shadow-[0_0_20px_hsl(179_80%_27%/0.4)]'
                    : 'text-white/70 hover:text-white/75'
                }`}
              >
                <Icon size={15} />
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>

        {/* ANIMATED CONTENT PANEL */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start"
          >
            {/* LEFT: Title + Description + CTA */}
            <div className="flex flex-col gap-8 rounded-2xl border border-white/8 bg-white/[0.04] p-8 sm:p-10 backdrop-blur-sm">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-on-dark">{activeData.tagline}</span>
                </div>
                <h3 className="font-heading text-2xl font-medium leading-[1.15] text-white sm:text-3xl lg:text-[2rem]">
                  {activeData.title}
                </h3>
                <p className="mt-5 text-sm leading-[1.8] text-white/50">
                  {activeData.description}
                </p>
              </div>

              {/* Big metric */}
              <div className="flex items-baseline gap-3 border-t border-white/8 pt-6">
                <span className="font-heading text-4xl font-bold text-white sm:text-5xl">
                  {activeData.metric.value}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                  {activeData.metric.label}
                </span>
              </div>

              {/* CTA */}
              <Link
                to={activeData.ctaHref}
                className="group inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/85 hover:shadow-[0_0_30px_hsl(179_80%_27%/0.35)]"
              >
                <span>{activeData.ctaText}</span>
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* RIGHT: Benefits list */}
            <div className="space-y-4">
              {activeData.benefits.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3, ease: 'easeOut' }}
                  className="group rounded-2xl border border-white/8 bg-white/[0.04] p-6 transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/25">
                      <CheckCircle2 size={14} className="text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="mt-2 text-xs leading-[1.75] text-white/70">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Switch prompt */}
              <button
                onClick={() => setActiveTab(activeTab === 'retail' ? 'wholesale' : 'retail')}
                className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-white/12 px-6 py-4 text-xs font-semibold text-white/60 transition-all duration-300 hover:border-accent/30 hover:text-accent"
              >
                <span>Not this profile? Switch to {InactiveData.label}</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
