import { SiteLoader } from '@/components/ui/SiteLoader';

// Fallback for any route without a more specific `loading.tsx`. Keeps a slow
// navigation from showing a blank page and gives the wait a branded look.
export default function Loading() {
  return <SiteLoader />;
}
