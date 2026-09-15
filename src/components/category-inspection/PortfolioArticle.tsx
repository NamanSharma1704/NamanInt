import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import ResponsiveImage from '@/components/ResponsiveImage';
import InspectionCanvas from '@/components/inspection-drawing/InspectionCanvas';
import { STEP_VH, useInspectionSequence } from '@/components/inspection-drawing/use-inspection-sequence';

import type { CategorySequence } from './sequences';

export interface PortfolioCategory {
  readonly id: string;
  readonly number: string;
  readonly categoryTag: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly materials: readonly string[];
  /** Inspection protocols, one per inspection process step, in order. */
  readonly standards: readonly string[];
  readonly leadTime: string;
  readonly volumeProfile: string;
  readonly contactParam: string;
}

export interface PortfolioArticleProps {
  readonly item: PortfolioCategory;
  readonly selected: boolean;
  /** The first category's photograph loads eagerly, with high priority. */
  readonly isDefault: boolean;
  /** The category's inspection process, if it has an inspection model. */
  readonly sequence?: CategorySequence;
  readonly reducedMotion: boolean | null;
}

const pad = (n: number): string => String(n).padStart(2, '0');

function CheckChip() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30"
    >
      <Check size={12} strokeWidth={2.75} className="text-accent-on-tint" />
    </span>
  );
}

/**
 * One category in the Manufacturing Portfolios section: its photograph on a raised stage beside its
 * specification.
 *
 * A category with an inspection model offers a "Photograph / Inspection process" switch under the
 * photograph, where WebGL 2 runs well. Inspection process replaces the whole panel: the model, in the
 * photograph's 4:3 frame, pinned beneath the header beside a process panel (the step list on a progress rail and the current
 * step's caption), while the title, specification and inquiry link step aside until the photograph is
 * chosen again. Scrolling moves through the category's protocols: the model turns toward each
 * inspection point and plays out that step (in the Textiles 3D scene, the element itself moves), and
 * the step's caption crossfades in.
 */
export default function PortfolioArticle({ item, selected, isDefault, sequence, reducedMotion }: PortfolioArticleProps) {
  const inspection = useInspectionSequence(sequence?.steps.length ?? 0, selected);
  const offersInspection = sequence !== undefined && inspection.available;
  const process = offersInspection && inspection.inspecting ? sequence : undefined;

  const photograph = (
    <ResponsiveImage
      src={item.image}
      alt={item.imageAlt}
      width={1200}
      height={900}
      sizes="(min-width: 1024px) 38vw, 100vw"
      loading={isDefault ? 'eager' : 'lazy'}
      fetchPriority={isDefault ? 'high' : 'auto'}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        process && inspection.ready ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );

  // Underline switch, matching the category filter bar above. The photograph stays the default.
  const viewSwitch = offersInspection && (
    <div role="group" aria-label="Figure view" className="mt-4 flex shrink-0 gap-6 border-b border-border">
      {[
        { process: false, label: 'Photograph' },
        { process: true, label: 'Inspection process' },
      ].map((option) => {
        const pressed = inspection.inspecting === option.process;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={pressed}
            onClick={option.process ? inspection.showInspection : inspection.showPhotograph}
            className={`relative cursor-pointer pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              pressed ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
            {pressed && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-on-tint" />}
          </button>
        );
      })}
    </div>
  );

  const categoryLabel = (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs tracking-[0.18em] text-gold">{item.number}</span>
      <div className="h-px w-6 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.categoryTag}</span>
    </div>
  );

  return (
    <article id={`category-${item.id}`} hidden={!selected}>
      <motion.div
        initial={false}
        animate={selected ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
        className="py-12 lg:py-14"
      >
        {process ? (
          // The inspection view: a frame pinned beneath the header, then a spacer whose scroll drives the process.
          <div ref={inspection.containerRef} data-inspection-container="">
            <div
              ref={inspection.pinnedRef}
              data-inspection-frame=""
              className="sticky top-[72px] z-10 -mx-5 bg-background px-5 py-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:h-[calc(100svh-72px)] lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:content-center lg:gap-x-16 lg:px-0 lg:py-6"
            >
              {/* The drawing and the process panel share the first row, so the panel's top and foot line up with the
                  drawing's; the switch sits in the row beneath. The figure keeps the photograph's 4:3 frame, capped so
                  it and the switch never outgrow a short screen. */}
              <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-[0_32px_64px_-32px_hsl(220_45%_15%/0.35)] ring-1 ring-border/70 lg:col-start-1 lg:row-start-1 lg:w-full lg:max-w-[calc((100svh-176px)*4/3)] lg:self-end">
                {photograph}
                <InspectionCanvas
                  markers={process.markers}
                  protocols={item.standards}
                  highlight={inspection.active}
                  subject={process.subject}
                  loadScene={process.loadScene}
                  onReady={inspection.markReady}
                  onFailed={inspection.handleFailed}
                  onScene={inspection.handleScene}
                />
              </figure>
              <div className="lg:col-start-1 lg:row-start-2 lg:w-full lg:max-w-[calc((100svh-176px)*4/3)]">{viewSwitch}</div>

              <div className="mt-4 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:flex lg:flex-col">
                <div className="hidden lg:block">{categoryLabel}</div>
                <h3 className="sr-only lg:not-sr-only lg:mt-5 lg:block lg:font-heading lg:text-3xl lg:leading-[1.15] lg:text-foreground">
                  Inspection process<span className="sr-only">: {item.title}</span>
                </h3>
                <p className="mt-3 hidden max-w-lg text-sm leading-[1.7] text-muted-foreground lg:block">
                  Scroll to follow each protocol, in the order it is applied.
                </p>

                <ol aria-label="Inspection steps" className="relative mt-7 hidden lg:block">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-border" />
                  <span ref={inspection.railRef} aria-hidden="true" className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-accent-on-tint" />
                  {process.steps.map((step, index) => (
                    <li key={step.title}>
                      <button
                        type="button"
                        onClick={() => inspection.goTo(index)}
                        aria-current={index === inspection.active ? 'step' : undefined}
                        className={`flex w-full cursor-pointer items-baseline gap-4 py-2.5 pl-6 text-left text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                          index === inspection.active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="font-mono text-xs font-normal tracking-[0.18em] text-gold">{pad(index + 1)}</span>
                        {step.title}
                      </button>
                    </li>
                  ))}
                </ol>

                <div className="flex gap-2 lg:hidden">
                  {process.steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => inspection.goTo(index)}
                      aria-label={`Show step ${index + 1}: ${step.title}`}
                      aria-current={index === inspection.active ? 'step' : undefined}
                      className="flex h-8 flex-1 cursor-pointer items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className={`h-0.5 w-full transition-colors duration-300 motion-reduce:transition-none ${
                          index <= inspection.active ? 'bg-accent-on-tint' : 'bg-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* On desktops the caption and note sit at the foot of the panel, level with the bottom of the drawing. */}
                <div className="mt-3 lg:mt-auto lg:pt-7">
                  {/* Every caption shares one grid cell, so the frame keeps the height of the longest and nothing shifts. */}
                  <ol className="grid lg:border-t lg:border-border lg:pt-6">
                    {process.steps.map((step, index) => {
                      const current = index === inspection.active;
                      return (
                        <li
                          key={step.title}
                          data-step-caption=""
                          className={`col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                            current ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
                          }`}
                        >
                          <p className="font-mono text-xs tracking-[0.18em] text-gold">
                            {pad(index + 1)} / {pad(process.steps.length)}
                          </p>
                          <h4 className="mt-1.5 font-heading text-lg leading-[1.25] text-foreground sm:text-xl">{step.title}</h4>
                          <p className="mt-2 max-w-lg text-sm leading-[1.7] text-muted-foreground">{step.text}</p>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mt-4 text-xs leading-[1.6] text-muted-foreground">{process.note ?? 'Illustrative drawing, not to scale.'}</p>
                </div>
              </div>
            </div>
            <div aria-hidden="true" data-inspection-spacer="" style={{ height: `${process.steps.length * STEP_VH}vh` }} />
          </div>
        ) : (
          <div ref={inspection.containerRef} className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-[0_32px_64px_-32px_hsl(220_45%_15%/0.35)] ring-1 ring-border/70">
                {photograph}
              </figure>
              {viewSwitch}
            </div>

            <div>
              {categoryLabel}
              <h3 className="mt-5 font-heading text-2xl leading-[1.15] text-balance text-foreground sm:text-3xl">{item.title}</h3>
              <p className="mt-4 max-w-2xl text-base leading-[1.8] text-muted-foreground">{item.description}</p>

              {/* Specification in a soft ivory block: grades and commercial terms on the left, inspection
                  protocols on the right. The page section is not a card, so this is the only box. */}
              <div className="mt-8 grid gap-x-10 gap-y-6 rounded-2xl border border-border bg-muted p-6 sm:grid-cols-2 sm:p-7">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Key material grades</dt>
                    <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">{item.materials.join(' · ')}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Lead time</dt>
                    <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">{item.leadTime}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Volume profile</dt>
                    <dd className="mt-1.5 text-sm leading-[1.7] text-foreground">{item.volumeProfile}</dd>
                  </div>
                </dl>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Inspection protocols</p>
                  <ul className="mt-1.5">
                    {item.standards.map((standard) => (
                      <li key={standard} className="border-t border-border py-2.5 text-sm leading-[1.7] text-foreground first:border-t-0 first:pt-1">
                        <span className="flex items-start gap-2.5">
                          <CheckChip />
                          <span>{standard}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to={`/contact?category=${item.contactParam}`}
                className="group mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent-on-tint transition-colors hover:text-foreground"
              >
                <span>Inquire for this category</span>
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </article>
  );
}
