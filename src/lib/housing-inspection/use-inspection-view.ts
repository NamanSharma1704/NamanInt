import { useCallback, useState } from 'react';

export interface InspectionView {
  /** The visitor has switched the figure to the drawing. */
  readonly on: boolean;
  /** The drawing has drawn its first frame, so the photograph can fade out. */
  readonly ready: boolean;
  /** Protocol pinned by a press. */
  readonly pinned: number | null;
  /** Protocol to emphasise: a hover or keyboard preview wins over the pin. */
  readonly highlight: number | null;
  showDrawing(): void;
  /** Also the fallback when WebGL fails; clears everything so the next visit starts clean. */
  showPhotograph(): void;
  markReady(): void;
  togglePin(protocol: number): void;
  preview(protocol: number | null): void;
}

/** State for a category figure that can switch from its photograph to the inspection drawing. */
export function useInspectionView(): InspectionView {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [pinned, setPinned] = useState<number | null>(null);
  const [previewed, setPreviewed] = useState<number | null>(null);

  const showDrawing = useCallback(() => setOn(true), []);
  const showPhotograph = useCallback(() => {
    setOn(false);
    setReady(false);
    setPinned(null);
    setPreviewed(null);
  }, []);
  const markReady = useCallback(() => setReady(true), []);
  const togglePin = useCallback((protocol: number) => setPinned((current) => (current === protocol ? null : protocol)), []);
  const preview = useCallback((protocol: number | null) => setPreviewed(protocol), []);

  return { on, ready, pinned, highlight: previewed ?? pinned, showDrawing, showPhotograph, markReady, togglePin, preview };
}
