import { RideManager } from '@/components/admin/RideManager';
export const metadata = { title: 'Rides admin' };
export default function AdminRides() {
  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-8" style={{ color: '#27302d' }}>
      <h1 className="text-2xl font-bold">Rides & sightseeing</h1>
      <p className="mt-1 text-sm text-[#616161]">Sightseeing packages and point-to-point transfers with fare-per-vehicle pricing. Replaces the old generic RIDE listing — keep using this page going forward.</p>
      <div className="mt-6"><RideManager /></div>
    </div>
  );
}
