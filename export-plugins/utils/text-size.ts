export const SIZE_SCALE = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
] as const;

export type SizeClass = (typeof SIZE_SCALE)[number];

const REM_MAP: Record<SizeClass, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',
};

const LINE_HEIGHT_MAP: Record<string, string> = {
  '0.75rem': '1rem',
  '0.875rem': '1.25rem',
  '1rem': '1.5rem',
  '1.125rem': '1.75rem',
  '1.25rem': '1.75rem',
  '1.5rem': '2rem',
  '1.875rem': '2.25rem',
  '2.25rem': '2.5rem',
  '3rem': '1',
  '3.75rem': '1',
  '4.5rem': '1',
  '6rem': '1',
  '8rem': '1',
};

export function remForSizeClass(size: SizeClass): string {
  return REM_MAP[size] ?? '1rem';
}

export function lineHeightForFontSize(rem: string): string {
  return LINE_HEIGHT_MAP[rem] ?? '1.5rem';
}
