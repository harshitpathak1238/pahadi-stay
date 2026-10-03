// Skeleton shown while the catalogue loads, so the page paints instantly
// instead of a blank screen. Matches the layout of StaysSearchPage.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 sm:py-5 md:px-6">
      <div className="animate-pulse rounded-full bg-white p-3 shadow-sm ring-1 ring-[#e4e3da]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-11 flex-1 rounded-xl bg-[#eef1ee]" />
          <div className="h-11 flex-1 rounded-xl bg-[#eef1ee]" />
          <div className="h-11 flex-1 rounded-xl bg-[#eef1ee]" />
          <div className="h-11 w-full rounded-xl bg-[#eef1ee] sm:w-32" />
          <div className="h-11 w-full rounded-xl bg-[#eef1ee] sm:w-24" />
          <div className="h-11 w-full rounded-xl bg-[#eef1ee] sm:w-12" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e3da]">
            <div className="aspect-[4/3] animate-pulse bg-[#e6eae6]" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#e6eae6]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#eef1ee]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}