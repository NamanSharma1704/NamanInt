import type { MouseEvent } from 'react';

/**
 * The first stop for keyboard users: a link past the header straight to the page's <main>.
 *
 * Hidden until it takes focus, then shown as a gold button above the header. The jump happens in code, as the site's
 * other in-page links do (see `followInPageLink`), and it finds <main> itself, so a page does not need to give it an
 * id; `href="#main"` still works without JavaScript on pages that do.
 */
export default function SkipLink() {
  const skip = (event: MouseEvent<HTMLAnchorElement>): void => {
    const main = document.getElementById('main') ?? document.querySelector('main');
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.scrollIntoView({ block: 'start' });
    main.focus({ preventScroll: true });
  };

  return (
    <a
      href="#main"
      onClick={skip}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-xl focus-visible:bg-accent focus-visible:px-5 focus-visible:py-3 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-accent-foreground focus-visible:shadow-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on-tint focus-visible:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
