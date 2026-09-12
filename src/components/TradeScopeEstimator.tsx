import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Sparkles } from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';
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

  return (
    <section className="border-b border-border bg-card/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Interactive Trade Configurator</p>
          <h2 className="mt-3 font-heading text-3xl leading-[1.08] text-foreground sm:text-4xl lg:text-5xl">
            Configure your trade scope.
          </h2>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground">
            Select your product category, volume profile, and operational scope to preview a tailored procurement roadmap.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          {/* Controls Column */}
          <div className="space-y-10">
            {/* Step 1: Category */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                  1
                </span>
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Select Product Category
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-background shadow-xs ring-1 ring-accent'
                          : 'border-border bg-background/60 hover:border-accent/40'
                      }`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                        {cat.label}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        Est. Lead Time: {cat.leadTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Order Volume */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                  2
                </span>
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Target Order Scale
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {volumes.map((vol) => {
                  const isSelected = selectedVolume.id === vol.id;
                  return (
                    <button
                      key={vol.id}
                      onClick={() => setSelectedVolume(vol)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-background shadow-xs ring-1 ring-accent'
                          : 'border-border bg-background/60 hover:border-accent/40'
                      }`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                        {vol.label}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">{vol.unitText}</span>
                      <span className="mt-3 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-on-tint">
                        {vol.moqBadge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Scope */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                  3
                </span>
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Select Required Services Scope
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {scopes.map((sc) => {
                  const isSelected = selectedScope.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScope(sc)}
                      className={`flex w-full flex-col items-start rounded-xl border p-5 text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-background shadow-xs ring-1 ring-accent'
                          : 'border-border bg-background/60 hover:border-accent/40'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={`text-base font-bold ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                          {sc.label}
                        </span>
                        {isSelected && <Check size={18} className="text-accent" />}
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{sc.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Summary Card */}
          <div className="relative sticky top-28 rounded-2xl border border-border bg-background p-8 shadow-sm overflow-hidden">
            <BorderBeam size={220} duration={12} colorFrom="#8B4513" colorTo="#2a4365" borderWidth={1.5} />
            <div className="flex items-center gap-2 border-b border-border pb-5">
              <Sparkles size={18} className="text-accent" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Configured Trade Roadmap
              </p>
            </div>

            <div className="mt-6 space-y-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Category Focus</p>
                <p className="font-bold text-foreground mt-0.5">{selectedCategory.label}</p>
              </div>
              <div className="h-px bg-border/60" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Volume Model</p>
                <p className="font-bold text-foreground mt-0.5">{selectedVolume.label} ({selectedVolume.unitText})</p>
              </div>
              <div className="h-px bg-border/60" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Service Scope</p>
                <p className="font-bold text-foreground mt-0.5">{selectedScope.label}</p>
              </div>
              <div className="h-px bg-border/60" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Primary Exit Port</p>
                <p className="font-bold text-foreground mt-0.5">{selectedCategory.port}</p>
              </div>
              <div className="h-px bg-border/60" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Estimated Production Window</p>
                <p className="font-bold text-foreground mt-0.5">{selectedCategory.leadTime}</p>
              </div>
            </div>

            {/* Included Deliverables */}
            <div className="mt-6 rounded-xl border border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-bold text-foreground">Included in this program:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {selectedScope.includes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <InteractiveHoverButton
                onClick={handleStartInquiry}
                className="w-full border-border/80 bg-primary text-primary-foreground hover:bg-accent text-sm tracking-wide"
              >
                Apply Scope & Inquire
              </InteractiveHoverButton>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
              Pre-populates your trade inquiry form with this configuration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
