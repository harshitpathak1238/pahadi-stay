'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export type VehicleTypeRow = {
  id: string;
  name: string;
  capacity: number;
  image: string | null;
  order: number;
};

const blankVehicleForm = () => ({ name: '', capacity: '4', image: '', order: '0' });

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<VehicleTypeRow[]>([]);
  const [form, setForm] = useState(blankVehicleForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/vehicle-types', { cache: 'no-store' });
      if (!res.ok) throw new Error('Vehicle types could not be loaded.');
      setVehicles(await res.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vehicle types could not be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const start = (vehicle?: VehicleTypeRow) => {
    setMessage('');
    setError('');
    if (vehicle) {
      setEditing(vehicle.id);
      setForm({
        name: vehicle.name,
        capacity: String(vehicle.capacity),
        image: vehicle.image || '',
        order: String(vehicle.order),
      });
    } else {
      setEditing(null);
      setForm(blankVehicleForm());
    }
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const payload = {
      name: form.name.trim() || 'Untitled vehicle type',
      capacity: Number(form.capacity || 4),
      image: form.image.trim() || null,
      order: Number(form.order || 0),
    };
    try {
      const res = await fetch(editing ? `/api/admin/vehicle-types/${editing}` : '/api/admin/vehicle-types', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || 'Could not save this vehicle type.');
        return;
      }
      setShowForm(false);
      setEditing(null);
      setForm(blankVehicleForm());
      setMessage(editing ? 'Vehicle type updated.' : 'Vehicle type created.');
      load();
    } catch {
      setError('Could not reach the vehicle types service.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (vehicle: VehicleTypeRow) => {
    if (!window.confirm(`Delete "${vehicle.name}"? Any ride fares using this vehicle will also be removed.`)) return;
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/vehicle-types/${vehicle.id}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || 'Could not delete this vehicle type.');
        return;
      }
      setMessage('Vehicle type deleted.');
      load();
    } catch {
      setError('Could not reach the vehicle types service.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#616161]">Manage the vehicle types available for ride pricing (e.g. Swift, Sedan, Tempo Traveller).</p>
        <button onClick={() => start()} className="inline-flex items-center gap-2 rounded-[4px] bg-[#24584a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173f35]">
          <Plus size={15} /> New vehicle type
        </button>
      </div>

      {message && <p role="status" className="rounded-[4px] border border-[#b7d8c6] bg-[#e8f5ed] px-3 py-2 text-sm font-semibold text-[#17633e]">{message}</p>}
      {error && <p role="alert" className="rounded-[4px] border border-[#f0c9c0] bg-[#fdf0ec] px-3 py-2 text-sm font-semibold text-[#a13d2c]">{error}</p>}

      <div className="overflow-x-auto rounded-[6px] border border-[#e1e1e3] bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-[#616161]">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t border-[#eee]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {v.image ? (
                      <img src={v.image} alt={v.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-[#eef3f0] text-xs text-[#526057]">IMG</div>
                    )}
                    <strong>{v.name}</strong>
                  </div>
                </td>
                <td className="px-4 py-3">{v.capacity} passengers</td>
                <td className="px-4 py-3">{v.order}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => start(v)} className="rounded border border-[#e1e1e3] px-2 py-1 hover:bg-[#f5f5f5]" aria-label={`Edit ${v.name}`}>
                    <Pencil size={14} />
                  </button>{' '}
                  <button onClick={() => remove(v)} className="rounded border border-[#f0c9c0] px-2 py-1 text-[#a13d2c] hover:bg-[#fdf0ec]" aria-label={`Delete ${v.name}`}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[#616161]">No vehicle types yet. Create Swift, Sedan, or Tempo Traveller to start.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="mx-auto w-full max-w-lg space-y-4 rounded-[8px] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing ? 'Edit vehicle type' : 'New vehicle type'}</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <label className="block text-sm font-semibold">
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Swift, Sedan, Tempo Traveller..." className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Capacity (passengers)
                <input type="number" min={1} max={60} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" />
              </label>
              <label className="block text-sm font-semibold">
                Order
                <input type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Image URL
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/swift.jpg" className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" />
            </label>
            {form.image && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-[#616161]">Preview:</p>
                <img src={form.image} alt="Preview" className="h-20 w-20 rounded object-cover" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded border border-[#e1e1e3] px-4 py-2 text-sm font-semibold">Cancel</button>
              <button disabled={busy} className="inline-flex items-center gap-2 rounded-[4px] bg-[#24584a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#173f35]">
                {busy ? 'Saving...' : <><Check size={15} /> {editing ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
