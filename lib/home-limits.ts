/**
 * How many items each home-page teaser rail promotes.
 *
 * These sections are deliberately short — the full catalogue always lives
 * behind the "see all" links — so they show a curated slice rather than
 * everything the database happens to return.
 *
 * Kept in its own module (rather than inline in `app/page.tsx`) so the values
 * can be asserted by unit tests without importing the page, which would pull
 * Prisma and the Next.js server runtime into the test process.
 */

/** Maximum homestays in the featured-stays rail. */
export const MAX_FEATURED_STAYS = 5;

/** Maximum packages in the "most popular packages" grid. */
export const MAX_FEATURED_PACKAGES = 3;

/**
 * Maximum journal stories.
 *
 * The journal renders as a horizontal scroller, so it carries more stories than
 * the fixed-grid sections — otherwise there would be nothing to scroll.
 */
export const MAX_FEATURED_STORIES = 8;
