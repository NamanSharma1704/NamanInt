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
      <img
        src="/logo.png"
        alt="NAMAN INTERNATIONAL LTD"
        width={220}
        height={66}
        className={`block h-auto max-h-11 md:max-h-12 w-auto object-contain ${
          isDark ? 'brightness-0 invert opacity-95' : ''
        } ${imgClassName}`}
      />
    </div>
  );
}
