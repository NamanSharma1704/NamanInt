import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Check, ClipboardCheck } from 'lucide-react';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

interface CategoryOption {
  id: string;
  label: string;
  leadTime: string;
  port: string;
}

interface VolumeOption {
  id: string;
  label: string;
  unitText: string;
  moqBadge: string;
}

interface ScopeOption {
  id: string;
  label: string;
  description: string;
  includes: string[];
}

const categories: CategoryOption[] = [
  { id: 'tech', label: 'Refurbished Tech & Electronics', leadTime: '20-30 Days', port: 'Shenzhen / Hong Kong' },
  { id: 'home', label: 'Home & Living', leadTime: '30-45 Days', port: 'Ningbo / Shenzhen' },
  { id: 'textiles', label: 'Textiles & Materials', leadTime: '25-40 Days', port: 'Shanghai / Shenzhen' },
  { id: 'hardware', label: 'Precision Components & Hardware', leadTime: '35-50 Days', port: 'Shenzhen / Dongguan' },
];

const volumes: VolumeOption[] = [
  { id: 'pilot', label: 'Evaluation Run', unitText: 'LCL / Sample Trial Batch', moqBadge: 'Flexible MOQ' },
  { id: 'fcl', label: 'Standard Container Run', unitText: '1 – 2 FCL (20ft / 40HQ)', moqBadge: 'Optimized Landed Cost' },
  { id: 'program', label: 'Annual Volume Program', unitText: 'Recurring Multi-Container Cadence', moqBadge: 'Dedicated Production Line' },
];

const scopes: ScopeOption[] = [
  {
    id: 'turnkey',
    label: 'Full Turnkey Program',
    description: 'Complete procurement management from factory audit and prototyping through to final port dispatch.',
    includes: ['Direct factory sourcing', 'AQL 2.5 on-site quality audit', 'Container consolidation & customs clearance'],
  },
  {
    id: 'qc',
    label: 'Quality & Factory Oversight Only',
    description: 'You have existing suppliers; we deploy our bilingual engineers on-site for audits and carton checks.',
    includes: ['Factory capability verification', 'In-line and final carton inspections', 'Photographic defect & dimension reports'],
  },
  {
    id: 'freight',
    label: 'Freight & Port Consolidation Only',
    description: 'We supervise container packing, export documentation, and Pacific ocean transit.',
    includes: ['Container stuffing supervision', 'VGM & export customs manifests', 'Pacific sailing coordination & B/L release'],
  },
];

/**
 * White option cards on the ivory band. The selected card carries a gold ring, a soft gold shadow and a check in its
 * corner, so the choice reads without relying on colour alone; the right padding keeps labels clear of that check.
 */
function optionClass(isSelected: boolean): string {
  return `relative flex flex-col items-start rounded-xl border bg-card p-4 pr-10 text-left transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
    isSelected
      ? 'border-accent shadow-[0_12px_28px_-16px_hsl(42_75%_45%/0.6)] ring-1 ring-accent'
      : 'border-border shadow-xs hover:border-accent/60 hover:shadow-md'
  }`;
}

function SelectedMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
    >
      <Check size={12} strokeWidth={3} />
    </span>
  );
}

function StepHeading({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
        {step}
      </span>
      <h3 className="font-sans text-sm font-bold uppercase tracking-[0.12em] text-foreground">{children}</h3>
    </div>
  );
}

function IncludedMark() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30"
    >
      <Check size={12} strokeWidth={2.75} className="text-accent-on-tint" />
    </span>
  );
}

export default function TradeScopeEstimator() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>(categories[0]);
  const [selectedVolume, setSelectedVolume] = useState<VolumeOption>(volumes[1]);
  const [selectedScope, setSelectedScope] = useState<ScopeOption>(scopes[0]);

  function handleStartInquiry() {
    const params = new URLSearchParams({
      category: selectedCategory.label,
      volume: selectedVolume.label,
      scope: selectedScope.label,
    });
    navigate(`/contact?${params.toString()}`);
  }

  const summary: Array<[string, string]> = [
    ['Category Focus', selectedCategory.label],
    ['Volume Model', `${selectedVolume.label} (${selectedVolume.unitText})`],
    ['Service Scope', selectedScope.label],
    ['Primary Exit Port', selectedCategory.port],
    ['Estimated Production Window', selectedCategory.leadTime],
  ];

  return (
    <section className="border-y border-border bg-muted py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-8 bg-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Interactive Trade Configurator
            </span>
          </div>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.06] tracking-[-0.025em] text-balance text-foreground">
            Configure your trade scope.
          </h2>
          <p className="mt-5 text-base leading-[1.8] text-muted-foreground sm:text-lg">
            Select your product category, volume profile, and operational scope to preview a tailored procurement roadmap.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start lg:gap-12">
          <div className="space-y-10">
            <div>
              <StepHeading step={1}>Select Product Category</StepHeading>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedCategory(cat)}
                      className={optionClass(isSelected)}
                    >
                      <SelectedMark show={isSelected} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-accent-on-tint' : 'text-foreground'}`}>
                        {cat.label}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">Est. Lead Time: {cat.leadTime}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <StepHeading step={2}>Target Order Scale</StepHeading>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {volumes.map((vol) => {
                  const isSelected = selectedVolume.id === vol.id;
                  return (
                    <button
                      key={vol.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedVolume(vol)}
                      className={optionClass(isSelected)}
                    >
                      <SelectedMark show={isSelected} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-accent-on-tint' : 'text-foreground'}`}>
                        {vol.label}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">{vol.unitText}</span>
                      <span className="mt-3 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent-on-tint ring-1 ring-inset ring-accent/30">
                        {vol.moqBadge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <StepHeading step={3}>Select Required Services Scope</StepHeading>
              <div className="mt-4 space-y-3">
                {scopes.map((sc) => {
                  const isSelected = selectedScope.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedScope(sc)}
                      className={`${optionClass(isSelected)} w-full p-5 pr-12`}
                    >
                      <SelectedMark show={isSelected} />
                      <span className={`text-base font-bold ${isSelected ? 'text-accent-on-tint' : 'text-foreground'}`}>
                        {sc.label}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground sm:text-sm">{sc.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live summary: one raised panel with the gold rule the closing panels use. Its checklist is a ruled block,
              not a card inside the card. It is not sticky: the panel is nearly as tall as the options beside it, so
              a pinned panel would travel about 70px and then scroll away anyway. */}
          <aside
            aria-label="Configured trade roadmap"
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-[0_30px_70px_-40px_hsl(220_45%_15%/0.3)] sm:p-8"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />

            <div className="flex items-center gap-3 border-b border-border pb-5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-inset ring-accent/30"
              >
                <ClipboardCheck size={16} className="text-accent-on-tint" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Configured Trade Roadmap</p>
            </div>

            <dl className="divide-y divide-border">
              {summary.map(([label, value]) => (
                <div key={label} className="py-3.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-border pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Included in this program
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-foreground">
                {selectedScope.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <IncludedMark />
                    <span className="leading-[1.6]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <InteractiveHoverButton
                type="button"
                onClick={handleStartInquiry}
                className="w-full border-accent bg-accent text-sm tracking-wide text-accent-foreground shadow-teal"
              >
                Apply Scope &amp; Inquire
              </InteractiveHoverButton>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Pre-populates your trade inquiry form with this configuration.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
