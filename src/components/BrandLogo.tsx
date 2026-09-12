import ResponsiveImage from '@/components/ResponsiveImage';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  imgClassName?: string;
}

export default function BrandLogo({
  variant = 'auto',
  className = '',
  imgClassName = '',
}: BrandLogoProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* The logo renders at 44-48px tall, so 220 and 440 CSS-pixel variants
          cover 1x and 2x. The 1346px-wide source was 302 KB on every page. */}
      <ResponsiveImage
        src="/assets/images/logo.png"
        alt="NAMAN INTERNATIONAL LTD"
        sizes="220px"
        width={220}
        height={66}
        loading="eager"
        fetchPriority="high"
        className={`block h-auto max-h-11 md:max-h-12 w-auto object-contain ${
          isDark ? 'brightness-0 invert opacity-95' : ''
        } ${imgClassName}`}
      />
    </div>
  );
}
