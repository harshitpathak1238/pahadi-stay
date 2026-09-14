import Link from 'next/link';

export type Crumb = { label: string; href?: string };

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
  variant?: 'light' | 'dark';
};

// Single shared breadcrumb trail used across the whole public site:
// Home › Section › (City) › Current page. Every ancestor is a working link,
// the current page is marked with aria-current. Horizontally scrollable on
// small screens so long titles never wrap or break the layout.
export function Breadcrumbs({ items, className = '', variant = 'light' }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const dark = variant === 'dark';
  return (
    <nav
      aria-label="Breadcrumb"
      className={`no-scrollbar min-w-0 overflow-x-auto whitespace-nowrap text-xs leading-relaxed ${dark ? 'text-white/65' : 'text-[#536274]'} ${className}`}
    >
      <ol className="flex min-w-0 items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center">
              {index > 0 && (
                <span aria-hidden="true" className={`mx-2 shrink-0 ${dark ? 'text-white/40' : ''}`}>
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`truncate ${isLast ? (dark ? 'font-semibold text-white' : 'font-semibold text-[#173f35]') : ''}`}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={`shrink-0 transition ${dark ? 'hover:text-white hover:underline' : 'hover:text-[#173f35] hover:underline'}`}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
