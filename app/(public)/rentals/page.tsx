import { RentalCard } from "@/components/ui/RentalCard";
import { RentalSearch } from "@/components/public/RentalSearch";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getPublicRentals } from "@/lib/listings";
import { matchesTextQuery } from "@/lib/search-params";
export const metadata = {
  title: "Scooty and bike rentals",
  description: "Book a scooty or bike for your Bhimtal and Kainchi Dham trip.",
};
export default async function Rentals({
  searchParams,
}: {
  searchParams: { where?: string };
}) {
  const { data: rentals, degraded } = await getPublicRentals();
  const query = (searchParams.where ?? "").trim();
  // Search on the rentals page too: the hero box sends "Rentals" searches here,
  // and they used to land on a full list with the place ignored.
  const filtered = rentals.filter((rental) =>
    matchesTextQuery(
      [rental.title, rental.type, rental.pickup, rental.description, ...rental.features].join(" "),
      query,
    ),
  );
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-10 md:py-20">
      {degraded && (
        <div className="mb-6 rounded-xl border border-[#e4d9bd] bg-[#fdf3e7] px-4 py-3 text-center text-sm font-semibold text-[#8a5a00]" role="status">
          Our rental catalog is temporarily unavailable — please check back shortly.
        </div>
      )}
      <section className="py-6 md:py-10">
        {/* Breadcrumb: Home › Rentals */}
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Rentals' }]} className="mb-6" />
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">
              Choose your ride
            </p>
            <h1 className="mt-3 text-4xl text-[#065f46] md:text-6xl">
              Ready when you are.
            </h1>
          </div>
          <p className="sans text-sm text-[#6c7770]">Transparent daily rates</p>
        </div>
        <p className="sans mt-4 max-w-xl text-base leading-7 text-[#607067]">
          Simple daily rentals for lake mornings, temple visits, and roads that
          invite you to slow down.
        </p>
        <RentalSearch query={query} />
        {query && (
          <p className="sans mt-6 text-sm text-[#526057]">
            Showing {filtered.length} of {rentals.length} rentals matching{" "}
            <strong>{query}</strong>.
          </p>
        )}
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {filtered.map((rental) => (
            <RentalCard key={rental.slug} rental={rental} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="sans mt-10 rounded-2xl border border-dashed border-[#dfe3d8] p-10 text-center text-[#526057]">
            No rentals match that search. Try &quot;Bhimtal&quot;, &quot;scooty&quot; or
            clear the search.
          </p>
        )}
      </section>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[#dfe3d8] bg-[#f4f8f4]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(6,95,70,.12)] backdrop-blur md:hidden">
        <div>
          <p className="sans text-xs font-bold uppercase tracking-[.12em] text-[#6c7770]">
            Need help choosing?
          </p>
          <p className="text-base text-[#065f46]">Talk to a local host</p>
        </div>
        <WhatsAppButton
          message="Hello KainchiDarshan, I want to know more about your scooter and bike rentals in Kumaon."
          className="shrink-0"
        />
      </div>
    </div>
  );
}
