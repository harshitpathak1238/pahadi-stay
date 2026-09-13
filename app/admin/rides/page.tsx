import { RideManager } from '@/components/admin/RideManager';
import { VehicleManager } from '@/components/admin/VehicleManager';
export const metadata = { title: 'Rides admin' };
export default function AdminRides() {
  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-8" style={{ color: '#27302d' }}>
      <h1 className="text-2xl font-bold">Rides & sightseeing</h1>
      <p className="mt-1 text-sm text-[#616161]">Sightseeing packages and point-to-point transfers with fare-per-vehicle pricing. Replaces the old generic RIDE listing — keep using this page going forward.</p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-[#24584a]">Vehicle types</h2>
        <VehicleManager />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold text-[#24584a]">Ride routes</h2>
        <RideManager />
      </section>
    </div>
  );
}
