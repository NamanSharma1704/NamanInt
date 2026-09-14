import { useEffect, useState } from 'react';

import { hasCapableWebGL2 } from '@/lib/webgl2';

/**
 * Whether the Categories inspection drawings can run in this browser. A drawing only loads when a visitor asks for it
 * (Precision Hardware) or reaches it (Packaging & Retail), so this probe decides whether it is offered at all.
 */
export function canRunInspectionDrawing(): boolean {
  return hasCapableWebGL2();
}

/**
 * Checked after mount rather than during render, so the server HTML and the first client render
 * agree (neither offers the switch) and it simply appears once WebGL 2 is confirmed.
 */
export function useInspectionDrawingAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(canRunInspectionDrawing());
  }, []);
  return available;
}
