/**
 * Branded full-screen loader.
 *
 * Used by route `loading.tsx` files, so it renders while Next.js resolves a
 * route's server data. It fills the viewport below the fixed site header and
 * fades itself out, so a fast response never shows a hard flash.
 *
 * Colours come from the same tokens as the rest of the site (`--pine`,
 * `--clay`, `--cream`) so the loader matches the brand rather than looking
 * bolted on.
 */
export function SiteLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="site-loader"
      role="status"
      aria-live="polite"
      aria-label={`${label}…`}
    >
      <div className="site-loader-inner">
        {/* Mountain range: two peaks with a slow "breathe" to suggest progress. */}
        <svg
          className="site-loader-mark"
          viewBox="0 0 120 56"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 54 L34 16 L52 40 L70 10 L118 54"
            stroke="var(--pine)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 54 L34 16 L46 30"
            stroke="var(--clay)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className="site-loader-wordmark">KainchiDarshan</span>

        <div className="site-loader-bar" aria-hidden="true">
          <span className="site-loader-bar-fill" />
        </div>

        <span className="sans text-[11px] font-bold uppercase tracking-[.22em] text-[#7c877d]">
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Content-shaped skeleton matching the public listing grids, so a slow
 * catalogue feels like it is loading rather than hanging.
 */
export function ListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 sm:py-5 md:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e3da]"
          >
            <div className="aspect-[4/3] bg-[#e6eae6] site-skeleton" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 rounded bg-[#e6eae6] site-skeleton" />
              <div className="h-3 w-1/2 rounded bg-[#eef1ee] site-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
