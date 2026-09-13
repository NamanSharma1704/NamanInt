import { useState } from 'react';
import { Award, ShieldCheck, Globe2, CheckCircle2 } from 'lucide-react';

interface MetricItem {
  id: string;
  metric: string;
  label: string;
  subtext: string;
  icon: typeof Award;
}

const metrics: MetricItem[] = [
  {
    id: 'heritage',
    metric: '18+ Years',
    label: 'Continuous International Trade',
    subtext: 'Established in Hong Kong in 2008 with uninterrupted China–North America procurement operations.',
    icon: Award,
  },
  {
    id: 'defect',
    metric: '<0.5%',
    label: 'Target Defect Tolerance',
    subtext: 'Standardized AQL Level II sampling plan ensuring finished goods match approved golden prototypes.',
    icon: ShieldCheck,
  },
  {
    id: 'hubs',
    metric: '4 Global Hubs',
    label: 'Strategic Physical Presence',
    subtext: 'Operational offices in Shenzhen (Production Hub), Hong Kong (Finance), California (US East/West Distribution), and Manchester (UK).',
    icon: Globe2,
  },
  {
    id: 'qc',
    metric: '100%',
    label: 'Pre-Shipment Inspection SLA',
    subtext: 'Zero containers dispatched without verified dimensional, barcode, and packaging inspection sign-off.',
    icon: CheckCircle2,
  },
];

export default function PrecisionMetrics() {
  const [activeTab, setActiveTab] = useState<'standards' | 'comparison'>('standards');

  return (
    <section className="border-b border-border bg-primary text-primary-foreground py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-primary-foreground/20 pb-12 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Quantitative Credibility</p>
            <h2 className="mt-3 font-heading text-3xl leading-[1.08] text-primary-foreground sm:text-4xl lg:text-5xl">
              Precision metrics built on 18 years of discipline.
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-primary-foreground/75">
              In international trade, reliability is measured in defect tolerances, on-time container clearances, and continuous accountability across the supply chain.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex rounded-lg border border-primary-foreground/20 p-1 bg-primary/60">
            <button
              onClick={() => setActiveTab('standards')}
              className={`rounded-md px-4 py-2 text-xs font-semibold tracking-wider transition-colors ${
                activeTab === 'standards'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-primary-foreground/70 hover:text-primary-foreground'
              }`}
            >
              Inspection Standards
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`rounded-md px-4 py-2 text-xs font-semibold tracking-wider transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-primary-foreground/70 hover:text-primary-foreground'
              }`}
            >
              Governance Matrix
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-7 transition-all duration-200 hover:border-accent hover:bg-primary-foreground/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    {item.label}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon size={16} />
                  </div>
                </div>

                <p className="mt-6 font-heading text-4xl sm:text-5xl text-primary-foreground font-normal">
                  {item.metric}
                </p>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-primary-foreground/70">
                  {item.subtext}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dynamic Detail Panel: Standards or Governance Matrix */}
        {activeTab === 'standards' ? (
          <div className="mt-12 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-8 sm:p-10">
            <h3 className="font-heading text-xl sm:text-2xl text-primary-foreground">
              AQL (Acceptable Quality Limit) Standard Protocol
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/75">
              Every production lot is audited under ANSI/ASQ Z1.4 (ISO 2859-1) General Inspection Level II standard before bills of lading are released.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-primary-foreground/15 p-5 bg-background/5">
                <span className="text-xs font-bold uppercase text-accent">Critical Defects</span>
                <p className="mt-2 font-heading text-3xl text-primary-foreground">0.0%</p>
                <p className="mt-1 text-xs text-primary-foreground/70">Safety hazards, regulatory violations, sharp edges, or non-functional parts.</p>
              </div>

              <div className="rounded-lg border border-primary-foreground/15 p-5 bg-background/5">
                <span className="text-xs font-bold uppercase text-accent">Major Defects</span>
                <p className="mt-2 font-heading text-3xl text-primary-foreground">2.5%</p>
                <p className="mt-1 text-xs text-primary-foreground/70">Appearance or functional blemishes that impair retail salability or performance.</p>
              </div>

              <div className="rounded-lg border border-primary-foreground/15 p-5 bg-background/5">
                <span className="text-xs font-bold uppercase text-accent">Minor Defects</span>
                <p className="mt-2 font-heading text-3xl text-primary-foreground">4.0%</p>
                <p className="mt-1 text-xs text-primary-foreground/70">Minor cosmetic variances that do not affect user functionality or retail presentation.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 overflow-x-auto rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 sm:p-8">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-primary-foreground/20 text-primary-foreground/60">
                  <th className="pb-3 font-semibold">Governance Area</th>
                  <th className="pb-3 font-semibold text-accent">NAMAN INTERNATIONAL LTD</th>
                  <th className="pb-3 font-semibold">Generic Broker</th>
                  <th className="pb-3 font-semibold">Unsupervised Factory Direct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-foreground/10 text-primary-foreground/80">
                <tr>
                  <td className="py-3 font-medium text-primary-foreground">Factory Floor Presence</td>
                  <td className="py-3 text-accent font-semibold">Direct on-site engineers (Shenzhen)</td>
                  <td className="py-3 text-primary-foreground/60">Subcontracted third-party</td>
                  <td className="py-3 text-primary-foreground/60">Zero local oversight</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-primary-foreground">Pre-Shipment Inspection</td>
                  <td className="py-3 text-accent font-semibold">Mandatory 100% carton sampling</td>
                  <td className="py-3 text-primary-foreground/60">Optional add-on fee</td>
                  <td className="py-3 text-primary-foreground/60">Factory self-reporting only</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-primary-foreground">Pricing Transparency</td>
                  <td className="py-3 text-accent font-semibold">Direct tier-1 factory pricing structure</td>
                  <td className="py-3 text-primary-foreground/60">Hidden markups / spot spread</td>
                  <td className="py-3 text-primary-foreground/60">Quoted without landed costs</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-primary-foreground">Accountability & Jurisdiction</td>
                  <td className="py-3 text-accent font-semibold">Hong Kong & US registered corporate entity</td>
                  <td className="py-3 text-primary-foreground/60">Offshore trading agent</td>
                  <td className="py-3 text-primary-foreground/60">Cross-border legal complexity</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
