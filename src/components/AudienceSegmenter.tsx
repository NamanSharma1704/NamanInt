import { Store, Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { Reveal } from '@/components/ui/reveal';

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

const audiences: AudienceData[] = [
  {
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
  {
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
];

/**
 * Both commercial paths, side by side and full-bleed, split by a single
 * hairline.
 *
 * This replaced a tab switcher sitting over two stacks of translucent cards.
 * The tabs hid half the content behind a click a buyer has no reason to make —
 * they already know which one they are — and the card stacks repeated the same
 * boxed-grid vocabulary used everywhere else on the page. Showing both at once
 * costs no extra height and lets a visitor self-identify at a glance.
 */
export default function AudienceSegmenter() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-[1440px] px-5 pb-14 pt-20 sm:px-8 lg:px-14 lg:pt-24">
        <Reveal rise={24} amount={0.3} className="max-w-2xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-8 bg-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Commercial Pathways
            </span>
          </div>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
            Who are you sourcing for?
          </h2>
          <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
            Two commercial profiles, each with its own operational protocol, compliance
            standard, and logistics model.
          </p>
        </Reveal>
      </div>

      {/* Two-up, split by hairlines: one full-bleed rule across the top and one
          down the middle. The columns share the heading's 1440px container, so
          on wide screens both panels line up with the heading instead of
          drifting to the viewport edges with empty space inside each half. */}
      <div className="border-t border-border">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            const isSecond = index === 1;
            return (
              <Reveal
                key={audience.id}
                rise={20}
                duration={0.55}
                delay={index * 0.08}
                className={
                  'flex flex-col px-5 py-12 sm:px-8 lg:px-14 lg:py-16' +
                  (isSecond ? ' border-t border-border lg:border-l lg:border-t-0' : '')
                }
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-inset ring-accent/15">
                    <Icon size={17} className="text-accent-on-tint" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                    {audience.label}
                  </span>
                </div>

                <h3 className="mt-6 max-w-xl font-heading text-2xl leading-[1.15] text-balance text-foreground sm:text-[1.875rem]">
                  {audience.title}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-[1.8] text-muted-foreground">
                  {audience.description}
                </p>

                {/* Benefits as a hairline-divided list rather than a stack of cards. */}
                <dl className="mt-10 max-w-xl">
                  {audience.benefits.map((item) => (
                    <div key={item.title} className="border-t border-border py-5">
                      <dt className="text-sm font-semibold text-foreground">{item.title}</dt>
                      <dd className="mt-1.5 text-sm leading-[1.7] text-muted-foreground">
                        {item.desc}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-auto max-w-xl pt-10">
                  <div className="flex items-baseline gap-3 border-t-2 border-accent-on-tint pt-5">
                    {/* shrink-0 + nowrap: "15–22%" is wider than "<0.5%" and was
                        breaking across two lines inside the flex row. */}
                    <span className="shrink-0 whitespace-nowrap font-heading text-4xl text-accent-on-tint sm:text-5xl">
                      {audience.metric.value}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {audience.metric.label}
                    </span>
                  </div>

                  <Link
                    to={audience.ctaHref}
                    className="group mt-8 inline-flex w-fit items-center gap-3 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-teal transition-[background-color,box-shadow] duration-300 hover:bg-accent-hover hover:shadow-teal-lg"
                  >
                    <span>{audience.ctaText}</span>
                    <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
