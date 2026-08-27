import { RentalCard } from "@/components/ui/RentalCard";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { rentals } from "@/lib/mock-data";
export const metadata = {
  title: "Scooty and bike rentals",
  description: "Book a scooty or bike for your Bhimtal and Kainchi Dham trip.",
};
export default function Rentals() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-10 md:py-20">
      <section className="py-6 md:py-10">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">
              Choose your ride
            </p>
            <h1 className="mt-3 text-4xl text-[#173f35] md:text-6xl">
              Ready when you are.
            </h1>
          </div>
          <p className="sans text-sm text-[#6c7770]">Transparent daily rates</p>
        </div>
        <p className="sans mt-4 max-w-xl text-base leading-7 text-[#607067]">
          Simple daily rentals for lake mornings, temple visits, and roads that
          invite you to slow down.
        </p>
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {rentals.map((rental) => (
            <RentalCard key={rental.slug} rental={rental} />
          ))}
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[#dfe3d8] bg-[#f7f4ec]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(23,63,53,.12)] backdrop-blur md:hidden">
        <div>
          <p className="sans text-xs font-bold uppercase tracking-[.12em] text-[#6c7770]">
            Need help choosing?
          </p>
          <p className="text-base text-[#173f35]">Talk to a local host</p>
        </div>
        <WhatsAppButton
          message="Hello KainchiDarshan, I want to know more about your scooter and bike rentals in Kumaon."
          className="shrink-0 px-3 py-2.5"
        />
      </div>
      <section className="border-t border-[#e4e3da] py-10">
        <div className="grid gap-5 text-center sm:grid-cols-3">
          <div>
            <p className="text-2xl text-[#b66b45]">₹500</p>
            <p className="sans mt-1 text-sm text-[#6c7770]">Scooty per day</p>
          </div>
          <div>
            <p className="text-2xl text-[#b66b45]">₹800</p>
            <p className="sans mt-1 text-sm text-[#6c7770]">Bike per day</p>
          </div>
          <div>
            <p className="text-2xl text-[#b66b45]">0</p>
            <p className="sans mt-1 text-sm text-[#6c7770]">Hidden charges</p>
          </div>
        </div>
      </section>
    </div>
  );
}
