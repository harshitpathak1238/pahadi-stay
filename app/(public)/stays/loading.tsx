import { ListingSkeleton } from '@/components/ui/SiteLoader';

// Skeleton shown while the catalogue loads, so the page paints instantly
// instead of a blank screen. Matches the layout of StaysSearchPage.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 sm:py-5 md:px-6">
      <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-[#e4e3da]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-11 flex-1 rounded-xl bg-[#eef1ee] site-skeleton" />
          ))}
          {[4, 5, 6].map((item) => (
            <div key={item} className="h-11 w-full rounded-xl bg-[#eef1ee] site-skeleton sm:w-28" />
          ))}
        </div>
      </div>
      <ListingSkeleton />
    </div>
  );
}