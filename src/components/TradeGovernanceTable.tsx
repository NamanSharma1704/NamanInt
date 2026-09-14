import { useState } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

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

// Darker shades than the -400s the old navy surface needed, so the icons hold 3:1 on the light grey.
const columns = [
  { key: 'factoryDirect', label: 'Unsupervised Factory Direct', icon: X, tone: 'text-red-600' },
  { key: 'genericBrokers', label: 'Generic Sourcing Brokers', icon: AlertTriangle, tone: 'text-amber-700' },
] as const;

/**
 * A four-parameter comparison of procurement models.
 *
 * Runs on the muted grey band, one step below the white disciplines section above it and the page background
 * below it, so the light sections still alternate. The NAMAN column is picked out with a faint gold tint and a gold
 * hairline. The table is flat and hairline-ruled rather than a rounded, shadowed card, and the mobile accordion does
 * not nest boxes inside boxes: DESIGN.md bans cards-in-cards.
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

        {/* Desktop: flat hairline-ruled table, no outer card. */}
        <div className="mt-14 hidden border-t border-border lg:block">
          <div className="grid grid-cols-12 border-b border-border text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <div className="col-span-3 px-5 py-4">Operational Parameter</div>
            <div className="col-span-3 border-l border-border px-5 py-4">
              Unsupervised Factory Direct
            </div>
            <div className="col-span-3 border-l border-border px-5 py-4">
              Generic Sourcing Brokers
            </div>
            <div className="col-span-3 border-l border-accent/20 bg-accent/[0.06] px-5 py-4 text-foreground">
              NAMAN Trade Governance
            </div>
          </div>

          {comparisonData.map((row) => (
            <div key={row.parameter} className="grid grid-cols-12 border-b border-border">
              <div className="col-span-3 flex items-center px-5 py-6">
                <p className="text-sm font-semibold text-foreground">{row.parameter}</p>
              </div>

              {columns.map((col) => {
                const Icon = col.icon;
                return (
                  <div
                    key={col.key}
                    className="col-span-3 flex items-start gap-2.5 border-l border-border px-5 py-6"
                  >
                    <Icon size={15} className={`mt-0.5 shrink-0 ${col.tone}`} />
                    <span className="text-sm leading-[1.7] text-muted-foreground">{row[col.key]}</span>
                  </div>
                );
              })}

              <div className="col-span-3 flex items-start gap-2.5 border-l border-accent/20 bg-accent/[0.06] px-5 py-6">
                <Check size={15} className="mt-0.5 shrink-0 text-accent-on-tint" strokeWidth={2.5} />
                <span className="text-sm font-medium leading-[1.7] text-foreground">
                  {row.namanGovernance}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: hairline-divided rows. No panels, no nested boxes. */}
        <div className="mt-10 border-t border-border lg:hidden">
          {comparisonData.map((row, idx) => {
            const isExpanded = mobileExpandedIndex === idx;
            return (
              <div key={row.parameter} className="border-b border-border">
                <button
                  onClick={() => toggleMobileIndex(idx)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-accent-on-tint"
                >
                  <span className="text-sm font-semibold text-foreground">{row.parameter}</span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="shrink-0 text-accent-on-tint" />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="pb-6">
                    <div className="border-l-2 border-accent-on-tint pl-4">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                        <Check size={13} strokeWidth={2.5} />
                        NAMAN Trade Governance
                      </p>
                      <p className="mt-2 text-sm leading-[1.7] text-foreground">
                        {row.namanGovernance}
                      </p>
                    </div>

                    {columns.map((col) => {
                      const Icon = col.icon;
                      return (
                        <div key={col.key} className="mt-5 border-l-2 border-border pl-4">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            <Icon size={13} className={col.tone} />
                            {col.label}
                          </p>
                          <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">
                            {row[col.key]}
                          </p>
                        </div>
                      );
                    })}
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
