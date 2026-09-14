import { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, X, type LucideIcon } from 'lucide-react';

interface ComparisonRow {
  parameter: string;
  factoryDirect: string;
  genericBrokers: string;
  namanGovernance: string;
}

const comparisonData: ComparisonRow[] = [
  {
    parameter: 'Quality Inspection Protocol',
    factoryDirect: 'Self-reported factory QC without independent verification.',
    genericBrokers: 'Casual sample photos; no standardized AQL defect limits.',
    namanGovernance: 'Formal ANSI/ASQ Z1.4 Level II AQL inspection with digital caliper and barcode verification.',
  },
  {
    parameter: 'On-Site Factory Floor Oversight',
    factoryDirect: 'Zero physical presence; communication limited to chat and email.',
    genericBrokers: 'Infrequent visits or outsourced freelance inspectors with no accountability.',
    namanGovernance: 'Bilingual production coordinators physically stationed in Pearl River Delta facilities weekly.',
  },
  {
    parameter: 'Defect Liability & Rework SLA',
    factoryDirect: 'Buyer absorbs 100% loss once container departs Chinese port.',
    genericBrokers: 'Responsibility shifted between overseas supplier and forwarder.',
    namanGovernance: 'Mandatory factory rework before dispatch or contractual credit replacement SLA.',
  },
  {
    parameter: 'Pricing Transparency & Cost Control',
    factoryDirect: 'Fluctuating quotes with unexpected export tariff and packaging surcharges.',
    genericBrokers: 'Hidden 15%–30% markup built into unit cost; supplier identity withheld.',
    namanGovernance: '100% transparent tier-1 factory pricing plus a fixed trade coordination fee.',
  },
];

// Red 600 and amber 700 on their 50 tints keep the marks above 3:1.
const columns = [
  { key: 'factoryDirect', label: 'Unsupervised Factory Direct', icon: X, mark: 'bg-red-50 text-red-600 ring-red-200' },
  { key: 'genericBrokers', label: 'Generic Sourcing Brokers', icon: AlertTriangle, mark: 'bg-amber-50 text-amber-700 ring-amber-200' },
] as const;

/** Navy check on the bright gold, 6.6:1. */
const NAMAN_MARK = 'bg-accent text-accent-foreground ring-accent';

function Mark({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${className}`}
    >
      <Icon size={12} strokeWidth={2.75} />
    </span>
  );
}

/**
 * A four-parameter comparison of procurement models.
 *
 * Sits on the warm ivory band as one raised white panel, so the comparison reads as a single object. The NAMAN column
 * is the only coloured one: a bright gold header with navy text, a faint gold wash down its cells, and gold check
 * marks. It is one panel with nothing boxed inside it, in line with the rule against cards in cards in DESIGN.md. On
 * phones the rows become an accordion inside the same panel.
 */
export default function TradeGovernanceTable() {
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(0);

  const toggleMobileIndex = (idx: number) => {
    setMobileExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="border-b border-border bg-muted py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-8 bg-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Governance Standard
            </span>
          </div>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
            Why partner with NAMAN vs. generic brokers or direct buying?
          </h2>
          <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
            A clear comparison of risk allocation, quality oversight, and financial
            transparency across overseas procurement models.
          </p>
        </div>

        {/* Desktop: one raised, hairline-ruled panel. */}
        <div className="mt-14 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_70px_-40px_hsl(220_45%_15%/0.28)] lg:block">
          <div className="grid grid-cols-12 border-b border-border text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <div className="col-span-3 px-6 py-5">Operational Parameter</div>
            {columns.map((col) => (
              <div key={col.key} className="col-span-3 border-l border-border px-6 py-5">
                {col.label}
              </div>
            ))}
            <div className="col-span-3 flex items-center gap-2 bg-accent px-6 py-5 text-accent-foreground">
              <Check size={14} strokeWidth={2.75} aria-hidden="true" />
              NAMAN Trade Governance
            </div>
          </div>

          {comparisonData.map((row) => (
            <div key={row.parameter} className="grid grid-cols-12 border-b border-border last:border-b-0">
              <div className="col-span-3 flex items-center px-6 py-6">
                <p className="text-sm font-semibold text-foreground">{row.parameter}</p>
              </div>

              {columns.map((col) => (
                <div key={col.key} className="col-span-3 flex items-start gap-3 border-l border-border px-6 py-6">
                  <span className="mt-0.5">
                    <Mark icon={col.icon} className={col.mark} />
                  </span>
                  <span className="text-sm leading-[1.7] text-muted-foreground">{row[col.key]}</span>
                </div>
              ))}

              <div className="col-span-3 flex items-start gap-3 border-l border-accent/30 bg-accent/[0.07] px-6 py-6">
                <span className="mt-0.5">
                  <Mark icon={Check} className={NAMAN_MARK} />
                </span>
                <span className="text-sm font-medium leading-[1.7] text-foreground">{row.namanGovernance}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Phones: the same panel holding an accordion of rows, with rules rather than nested boxes. */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card px-5 shadow-[0_20px_50px_-34px_hsl(220_45%_15%/0.28)] lg:hidden">
          {comparisonData.map((row, idx) => {
            const isExpanded = mobileExpandedIndex === idx;
            return (
              <div key={row.parameter} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleMobileIndex(idx)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{row.parameter}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
                      isExpanded ? 'rotate-180 text-accent-on-tint' : 'text-muted-foreground'
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="pb-6">
                    <div className="border-l-2 border-accent pl-4">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                        <Mark icon={Check} className={NAMAN_MARK} />
                        NAMAN Trade Governance
                      </p>
                      <p className="mt-2 text-sm leading-[1.7] text-foreground">{row.namanGovernance}</p>
                    </div>

                    {columns.map((col) => (
                      <div key={col.key} className="mt-5 border-l-2 border-border pl-4">
                        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          <Mark icon={col.icon} className={col.mark} />
                          {col.label}
                        </p>
                        <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{row[col.key]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
