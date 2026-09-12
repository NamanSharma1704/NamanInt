import manifest from '../../public/assets/images/r/manifest.json';

type Variant = { w: number; ext: string };
type Entry = { widths: Variant[]; intrinsic: { w: number; h: number } };

const variants = manifest as unknown as Record<string, Entry>;

/**
 * Extracts the manifest key from a local image path.
 * Returns null for anything we have not pre-generated variants for — notably
 * the CDN URLs in src/lib/media.ts, which are served by someone else's origin
 * and cannot carry our srcset.
 */
function keyFor(src: string): string | null {
  const match = /^\/assets\/images\/([^/]+)\.(jpe?g|png)$/i.exec(src);
  if (!match) return null;
  return match[1] in variants ? match[1] : null;
}

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  /**
   * The `sizes` attribute. Get this right or srcset is decoration: the browser
   * picks a candidate before layout, so it trusts this value over reality.
   */
  sizes: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Overrides the intrinsic dimensions recorded in the manifest. */
  width?: number;
  height?: number;
}

/**
 * Renders a `<picture>` with AVIF and WebP sources over the original format,
 * plus width-based srcset, for images that `npm run images:optimize` has
 * processed. Anything else degrades to a plain `<img>` with the same props, so
 * this is safe to use for a mixed list of local and remote sources.
 *
 * `width`/`height` are always emitted: without them the browser cannot reserve
 * the box and every one of these images shifts the layout as it arrives.
 */
export default function ResponsiveImage({
  src,
  alt,
  sizes,
  className,
  loading = 'lazy',
  fetchPriority,
  width,
  height,
}: ResponsiveImageProps) {
  const key = keyFor(src);

  if (!key) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        decoding="async"
      />
    );
  }

  const entry = variants[key];
  const srcsetFor = (ext: string) =>
    entry.widths.map((v) => `/assets/images/r/${key}-${v.w}.${ext} ${v.w}w`).join(', ');

  const fallbackExt = entry.widths[0].ext;
  const largest = entry.widths[entry.widths.length - 1];

  return (
    <picture>
      <source type="image/avif" srcSet={srcsetFor('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcsetFor('webp')} sizes={sizes} />
      <img
        src={`/assets/images/r/${key}-${largest.w}.${fallbackExt}`}
        srcSet={srcsetFor(fallbackExt)}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width ?? entry.intrinsic.w}
        height={height ?? entry.intrinsic.h}
        decoding="async"
      />
    </picture>
  );
}
