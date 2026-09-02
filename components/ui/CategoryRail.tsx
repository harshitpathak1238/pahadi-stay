'use client';

import { usePathname } from 'next/navigation';
import { CategoryTabs } from './CategoryTabs';

const hiddenPaths = ['/login', '/signup', '/reset-password', '/checkout', '/booking-confirmation'];

export function CategoryRail() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin') || hiddenPaths.some((path) => pathname.startsWith(path))) return null;
  return <div className="category-rail"><div className="mx-auto max-w-7xl px-4 py-2 md:px-5"><CategoryTabs navigate /></div></div>;
}
