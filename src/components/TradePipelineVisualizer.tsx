import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Compass, CheckCircle2, Ship, MapPin, ArrowRight, FileCheck, Clock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';

interface PipelineStage {
  id: number;
  number: string;
  name: string;
  location: string;
  tag: string;
  timeframe: string;
  summary: string;
  deliverables: string[];
  checkpoint: string;
  icon: typeof Search;
}

const pipelineStages: PipelineStage[] = [
  {
    id: 1,
    number: '01',
    name: 'Supplier Audit & Specification Brief',
    location: 'Shenzhen & Pearl River Delta Hubs',
    tag: 'Factory Validation',
    timeframe: 'Days 1 – 10',
    summary:
      'We identify, vet, and audit tier-1 manufacturers directly on the ground in China. Every potential supplier undergoes on-site operational verification.',
    deliverables: [
      'Factory ISO9001/14001 compliance audit',
      'Production capacity & machine capability audit',
      'Raw material supplier chain of custody review',
      'Direct commercial terms & tier-1 pricing breakdown',
    ],
    checkpoint: 'Verified factory audit report & signed manufacturing brief',
    icon: Search,
  },
  {
    id: 2,
    number: '02',
    name: 'Sample Sign-Off & Tooling Calibration',
    location: 'Guangdong & Zhejiang Production Facilities',
    tag: 'Pre-Production',
    timeframe: 'Days 11 – 25',
    summary:
      'Before mass fabrication begins, physical prototypes and golden samples are reviewed for tolerance precision, material integrity, and packaging alignment.',
    deliverables: [
      'Golden master sample physical evaluation',
      'Color matching to Pantone / master swatch standards',
      'Retail packaging dielines & UPC barcode scan testing',
      'Tooling calibration & mold tolerance approvals',
    ],
    checkpoint: 'Physical sample sign-off sheet approved by buyer',
    icon: Compass,
  },
  {
    id: 3,
    number: '03',
    name: 'In-Line & Final Pre-Shipment Quality Protocol',
    location: 'Factory Floor Assembly Line',
    tag: 'AQL 2.5 Inspection',
    timeframe: 'Days 26 – 42',
    summary:
      'Our dedicated QC engineers inspect goods while in production and conduct rigorous random carton inspections before factory gate release.',
    deliverables: [
      'AQL Level II sampling plan (2.5 Major / 4.0 Minor)',
      'Digital caliper dimensional measurements',
      'Functional drop test & moisture content analysis',
      'Defect photo documentation and serial verification',
    ],
    checkpoint: 'Official pre-shipment inspection certificate issued',
    icon: FileCheck,
  },
  {
    id: 4,
    number: '04',
    name: 'Container Consolidation & Port Clearance',
    location: 'Yantian & Shekou Deepwater Terminals',
    tag: 'Port Dispatch',
    timeframe: 'Days 43 – 48',
    summary:
      'Goods are consolidated, palletized, and loaded into 20ft / 40ft / 40HQ containers under direct supervision, followed by Chinese export clearance.',
    deliverables: [
      'Container loading inspection & seal verification',
      'Export customs declaration & clearance documentation',
      'Verified Gross Mass (VGM) container certification',
      'Clean on-board Ocean Bill of Lading (B/L)',
    ],
    checkpoint: 'Container vessel loading confirmation & tracking reference',
    icon: Ship,
  },
  {
    id: 5,
    number: '05',
    name: 'Ocean Transit & North American Port Receipt',
    location: 'Pacific Route → Los Angeles / Long Beach / NY',
    tag: 'Destination Delivery',
    timeframe: 'Days 49 – 65',
    summary:
      'Continuous milestone tracking across Pacific sailing routes, automated customs clearance pre-filing, and coordinated warehouse gate appointments.',
    deliverables: [
      'Automated milestone tracking updates',
      'US / Canadian customs clearance documentation',
      'Port drayage and rail intermodal transfer',
      'Final delivery to regional distribution center',
    ],
    checkpoint: 'Signed delivery receipt (POD) & closed shipment manifest',
    icon: MapPin,
  },
];

export default function TradePipelineVisualizer() {
  const [activeStageId, setActiveStageId] = useState<number>(3); // Default to QC stage for impact
  const activeStage = pipelineStages.find((s) => s.id === activeStageId) || pipelineStages[0];

  return (
    <section className="relative border-b border-border bg-muted/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Real-Time Visibility</p>
          <h2 className="mt-3 font-heading text-3xl leading-[1.08] text-foreground sm:text-4xl lg:text-5xl">
            End-to-end chain of custody.
          </h2>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground">
            Click through the 5 operational milestones that connect supplier discovery in China to verified warehouse delivery in North America.
          </p>
        </div>

        {/* Milestone Tracker Stepper (project44-inspired) */}
        <div className="mt-12 overflow-x-auto pb-4">
          <div className="grid min-w-[760px] grid-cols-5 gap-3">
            {pipelineStages.map((stage) => {
              const isActive = stage.id === activeStageId;
              const isPast = stage.id < activeStageId;
              const Icon = stage.icon;

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-accent bg-background shadow-md ring-1 ring-accent'
                      : 'border-border bg-card/80 hover:border-accent/50 hover:bg-background'
                  }`}
                >
                  {/* Top Step Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isActive ? 'text-accent' : isPast ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Stage {stage.number}
                    </span>
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : isPast
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm font-bold text-foreground group-hover:text-accent">
                    {stage.name}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                    <span>{stage.timeframe}</span>
                    <span className={`font-semibold ${isActive ? 'text-accent' : ''}`}>{stage.tag}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Stage Inspector Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-8 overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left Column: Stage Detail & Deliverables */}
              <div className="p-8 sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                    Stage {activeStage.number} Milestone
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={14} className="text-accent" />
                    <span>{activeStage.timeframe}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={14} className="text-accent" />
                    <span>{activeStage.location}</span>
                  </span>
                </div>

                <h3 className="mt-4 font-heading text-2xl sm:text-3xl text-foreground">
                  {activeStage.name}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {activeStage.summary}
                </p>

                {/* Key Deliverables Checkpoints */}
                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                    Mandatory Operational Deliverables
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeStage.deliverables.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-card/60 p-3.5">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                        <span className="text-xs font-medium leading-5 text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Stage Verification Box & Call to Action */}
              <div className="flex flex-col justify-between border-t border-border bg-card/70 p-8 sm:p-10 lg:border-l lg:border-t-0">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                    <ShieldAlert size={15} />
                    <span>Quality & Gatekeeper Checkpoint</span>
                  </div>
                  <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-5">
                    <p className="text-xs font-bold uppercase text-accent">Gate Approval Condition</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">
                      {activeStage.checkpoint}
                    </p>
                  </div>

                  <div className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">NAMAN Custody Advantage:</p>
                    <p>• Daily bilingual liaison between factory production managers and North American buyers.</p>
                    <p>• Zero handoff to third-party commission brokers.</p>
                    <p>• Direct photographic and dimensional log uploaded to buyer prior to payment milestones.</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <Link
                    to="/contact"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-accent"
                  >
                    <span>Request Full Trade Protocol PDF</span>
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
