import { ArrowLeft, Home } from 'lucide-react';
import { Link } from '../router';

/**
 * 404 Not Found page component
 *
 * Designed with authoritative enterprise typography, SVG icons,
 * and stable hover transitions conforming to UI/UX Pro Max & Impeccable standards.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-24">
      <div className="container mx-auto px-4 max-w-xl text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold-soft/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
              404 Routing Error
            </span>
            <h1 className="text-5xl sm:text-6xl font-heading font-bold text-foreground tracking-tight">
              Page Not Found
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
              The international trade resource or document you requested could not be located or has been transferred.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-accent text-accent-foreground font-semibold text-sm rounded-lg shadow-teal transition-colors duration-200 hover:bg-accent-hover cursor-pointer"
            >
              <Home size={16} />
              <span>Return Home</span>
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2.5 px-6 py-3 border border-border bg-card text-foreground font-semibold text-sm rounded-lg transition-colors duration-200 hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
