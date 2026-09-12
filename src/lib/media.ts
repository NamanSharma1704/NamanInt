/**
 * Production URLs for the media slots referenced by the pages.
 *
 * The `/airo-assets/images/<slot>` paths these replace only resolve under the
 * builder's Vite plugin (export-plugins/media-assets-plugin.ts), which 302s the
 * request on to the CDN. That plugin registers itself through `configureServer`
 * and `configurePreviewServer` only, so it never runs against a production
 * build: the paths 404 and fall through to the SPA HTML shell, and the browser
 * renders a broken image.
 *
 * The values below are the same CDN URLs the plugin would have redirected to —
 * the `currentUrl` of each slot in airo-media.json, which stays the source of
 * truth. Keep them in sync when a slot changes there.
 */
export const mediaSlots = {
  'pages/home/hero-container-terminal': 'https://img1.wsimg.com/isteam/getty/2252110004',
  'pages/trade-services/procurement-desk': 'https://img1.wsimg.com/isteam/getty/2229995150',
  'pages/categories/packaging-merchandising': 'https://img1.wsimg.com/isteam/getty/2276836281',
  'pages/categories/textiles-materials': 'https://img1.wsimg.com/isteam/getty/1336419387',
  'pages/categories/home-living': 'https://img1.wsimg.com/isteam/getty/2243887744',
  'pages/categories/seasonal-promotional': 'https://img1.wsimg.com/isteam/getty/2183733823',
} as const;

export type MediaSlot = keyof typeof mediaSlots;

/** Absolute CDN URL for a media slot. Safe for both `<img src>` and og:image. */
export function mediaUrl(slot: MediaSlot): string {
  return mediaSlots[slot];
}
