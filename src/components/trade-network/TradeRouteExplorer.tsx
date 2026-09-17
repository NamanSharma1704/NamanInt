import { useState, type FocusEvent } from 'react';

import TradeNetwork from './TradeNetwork';

export interface RouteStep {
  readonly num: string;
  readonly label: string;
  readonly place: string;
  /** A shorter name for the station label under the narrow drawing. */
  readonly short: string;
  readonly desc: string;
}

interface TradeRouteExplorerProps {
  readonly steps: readonly RouteStep[];
}

/** Keyboard focus previews a stage; focus that follows a tap does not. */
function isKeyboardFocus(event: FocusEvent<HTMLElement>): boolean {
  try {
    return event.currentTarget.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * The route diagram and its three stages. The stages are the diagram's
 * controls: hovering with a mouse or focusing with a keyboard previews that
 * station in the drawing, and pressing a stage pins the highlight. The stations
 * are named under the drawing, and a name lights with its station, so a stage
 * and the part of the drawing it controls read as one. The text is the
 * accessible source of truth — the drawing itself is aria-hidden.
 *
 * On phones the stages stack below the drawing, so the drawing pins beneath the
 * header while they scroll past; a tap on stage 02 or 03 lights a station that
 * is still on screen.
 */
export default function TradeRouteExplorer({ steps }: TradeRouteExplorerProps) {
  const [pinnedStep, setPinnedStep] = useState<number | null>(null);
  const [previewStep, setPreviewStep] = useState<number | null>(null);
  const highlightStep = previewStep ?? pinnedStep;

  return (
    <>
      <TradeNetwork
        className="sticky top-[72px] z-10 mt-10 bg-background pb-4 pt-2 sm:static sm:pb-0 sm:pt-0"
        highlightStep={highlightStep}
        stations={steps}
      />

      <ol className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
        {steps.map((step, index) => {
          const pinned = pinnedStep === index;
          const emphasised = highlightStep === index;
          return (
            <li key={step.num} className="bg-background">
              <button
                type="button"
                aria-pressed={pinned}
                onClick={() => setPinnedStep(pinned ? null : index)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setPreviewStep(index);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') setPreviewStep(null);
                }}
                onFocus={(event) => {
                  if (isKeyboardFocus(event)) setPreviewStep(index);
                }}
                onBlur={() => setPreviewStep(null)}
                className={
                  'block h-full w-full px-7 py-8 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ' +
                  (emphasised ? 'bg-card shadow-[inset_0_2px_0_hsl(var(--accent-on-tint))]' : 'hover:bg-card')
                }
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gold">{step.num}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {step.label}
                  </span>
                </span>
                <span className="mt-4 block text-base font-semibold text-foreground">{step.place}</span>
                <span className="mt-2 block text-sm leading-[1.7] text-muted-foreground">{step.desc}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
