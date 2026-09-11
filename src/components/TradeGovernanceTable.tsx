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
    namanGovernance: '100% Transparent tier-1 factory pricing + fixed trade coordination fee.',
  },
];

export default function TradeGovernanceTable() {
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(0);

  const toggleMobileIndex = (idx: number) => {
    setMobileExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="border-b border-border bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Governance Standard
          </p>
          <h2 className="mt-3 font-heading text-3xl leading-[1.1] text-foreground sm:text-4xl lg:text-5xl">
            Why partner with NAMAN vs. generic brokers or direct buying?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A clear comparison of risk allocation, quality oversight, and financial transparency across overseas procurement models.
          </p>
        </div>

        {/* Desktop Clean Grid View */}
        <div className="mt-14 hidden overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:block">
          <div className="grid grid-cols-12 border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3 p-5">Operational Parameter</div>
            <div className="col-span-3 p-5 border-l border-border/80">Unsupervised Factory Direct</div>
            <div className="col-span-3 p-5 border-l border-border/80">Generic Sourcing Brokers</div>
            <div className="col-span-3 p-5 border-l border-accent/40 bg-primary text-primary-foreground font-bold">
              NAMAN Trade Governance
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {comparisonData.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 transition-colors hover:bg-muted/20"
              >
                {/* Parameter */}
                <div className="col-span-3 p-6 flex items-center">
                  <p className="font-bold text-sm text-foreground">{row.parameter}</p>
                </div>

                {/* Factory Direct */}
                <div className="col-span-3 p-6 border-l border-border/60 flex items-start gap-2.5 text-sm text-muted-foreground">
                  <X size={16} className="mt-0.5 shrink-0 text-destructive/80" />
                  <span className="leading-relaxed">{row.factoryDirect}</span>
                </div>

                {/* Generic Brokers */}
                <div className="col-span-3 p-6 border-l border-border/60 flex items-start gap-2.5 text-sm text-muted-foreground">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600/80" />
                  <span className="leading-relaxed">{row.genericBrokers}</span>
                </div>

                {/* NAMAN Governance */}
                <div className="col-span-3 p-6 border-l border-accent/40 bg-primary/5 flex items-start gap-2.5 text-sm font-medium text-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent stroke-[2.5]" />
                  <span className="leading-relaxed font-semibold text-foreground">{row.namanGovernance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Accordion View */}
        <div className="mt-8 space-y-3 lg:hidden">
          {comparisonData.map((row, idx) => {
            const isExpanded = mobileExpandedIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-border bg-card transition-all"
              >
                <button
                  onClick={() => toggleMobileIndex(idx)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="text-sm font-bold text-foreground">{row.parameter}</span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-accent" />
                  ) : (
                    <ChevronDown size={18} className="text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-3 text-xs">
                    {/* NAMAN */}
                    <div className="rounded-lg bg-primary/10 border border-accent/40 p-3.5">
                      <div className="flex items-center gap-1.5 text-accent font-bold mb-1">
                        <Check size={14} />
                        <span>NAMAN Trade Governance</span>
                      </div>
                      <p className="text-foreground font-medium leading-relaxed">{row.namanGovernance}</p>
                    </div>

                    {/* Generic Brokers */}
                    <div className="rounded-lg bg-muted/40 p-3 border border-border">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold mb-1">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span>Generic Sourcing Brokers</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{row.genericBrokers}</p>
                    </div>

                    {/* Factory Direct */}
                    <div className="rounded-lg bg-muted/40 p-3 border border-border">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold mb-1">
                        <X size={14} className="text-destructive" />
                        <span>Unsupervised Factory Direct</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{row.factoryDirect}</p>
                    </div>
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
