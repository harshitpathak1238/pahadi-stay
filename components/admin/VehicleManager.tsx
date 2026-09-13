'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, GripVertical } from 'lucide-react';

export type VehicleTypeRow = {
  id: string;
  name: string;
  capacity: number;
  image: string | null;
  order: number;
};

const blankVehicleForm = () => ({ name: '', capacity: '4', image: '' });

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<VehicleTypeRow[]>([]);
  const [form, setForm] = useState(blankVehicleForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const dragNode = useRef<HTMLTableRowElement | null>(null);

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

  useEffect(() => { load(); }, [load]);

  const updateOrder = async (updated: VehicleTypeRow[]) => {
    setReordering(true);
    try {
      const res = await fetch('/api/admin/vehicle-types/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles: updated.map((v, i) => ({ id: v.id, order: i })) }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) setError(result.error || 'Could not update order.');
      else { setMessage('Order updated.'); setTimeout(() => setMessage(''), 2000); }
    } catch { setError('Could not update order.'); }
    finally { setReordering(false); }
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    setDraggedId(id);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.5'; }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id) setDragOverId(id);
  };

  const handleDragLeave = () => { setDragOverId(null); };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    setDraggedId(null);
    if (dragNode.current) dragNode.current.style.opacity = '1';
    dragNode.current = null;
    if (!draggedId || draggedId === targetId) return;

    const items = [...vehicles];
    const fromIdx = items.findIndex((v) => v.id === draggedId);
    const toIdx = items.findIndex((v) => v.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    const updated = items.map((v, i) => ({ ...v, order: i }));
    setVehicles(updated);
        updateOrder(updated);
  }

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    if (dragNode.current) dragNode.current.style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
    dragNode.current = null;
  };

  const start = (vehicle?: VehicleTypeRow) => {
    setMessage(''); setError('');
    if (vehicle) {
      setEditing(vehicle.id);
      setForm({ name: vehicle.name, capacity: String(vehicle.capacity), image: vehicle.image || '' });
    } else {
      setEditing(null);
      setForm(blankVehicleForm());
    }
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const payload = { name: form.name.trim() || 'Untitled vehicle type', capacity: Number(form.capacity || 4), image: form.image.trim() || null };
    try {
      const res = await fetch(editing ? `/api/admin/vehicle-types/${editing}` : '/api/admin/vehicle-types', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { setError(result.error || 'Could not save this vehicle type.'); return; }
      setShowForm(false); setEditing(null); setForm(blankVehicleForm());
      setMessage(editing ? 'Vehicle type updated.' : 'Vehicle type created.');
      load();
    } catch { setError('Could not reach the vehicle types service.'); }
    finally { setBusy(false); }
  };

  const remove = async (vehicle: VehicleTypeRow) => {
    if (!window.confirm(`Delete "${vehicle.name}"? Any ride fares using this vehicle will also be removed.`)) return;
    setError(''); setMessage('');
    try {
      const res = await fetch(`/api/admin/vehicle-types/${vehicle.id}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { setError(result.error || 'Could not delete this vehicle type.'); return; }
      setMessage('Vehicle type deleted.'); load();
    } catch { setError('Could not reach the vehicle types service.'); }
  };

  return (
    <div className="space-y-3">
      {message && <p role="status" className="rounded-[4px] border border-[#b7d8c6] bg-[#e8f5ed] px-3 py-2 text-sm font-semibold text-[#17633e]">{message}</p>}
      {error && <p role="alert" className="rounded-[4px] border border-[#f0c9c0] bg-[#fdf0ec] px-3 py-2 text-sm font-semibold text-[#a13d2c]">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#888]">Drag to reorder</p>
        <button onClick={() => start()} className="inline-flex items-center gap-2 rounded-[4px] bg-[#24584a] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#173f35]"><Plus size={15} /> Add vehicle type</button>
      </div>

      <div className="overflow-x-auto rounded-[6px] border border-[#e1e1e3] bg-white">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-[#616161]"><tr><th className="px-3 py-2 w-10"></th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Capacity</th><th className="px-3 py-2">Image</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} draggable
                onDragStart={(e) => handleDragStart(e, v.id)}
                onDragOver={(e) => handleDragOver(e, v.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, v.id)}
                onDragEnd={handleDragEnd}
                className={`border-t border-[#eee] cursor-move transition-colors ${dragOverId === v.id ? 'bg-[#e8f5ed]' : ''} ${draggedId === v.id ? 'opacity-50' : ''}`}
              >
                <td className="px-3 py-2"><div className="flex items-center gap-1 text-[#999] cursor-grab active:cursor-grabbing"><GripVertical size={14} /><span className="text-xs font-mono">{v.order}</span></div></td>
                <td className="px-3 py-2 font-medium text-[#173f35]">{v.name}</td>
                <td className="px-3 py-2 text-[#616161]">{v.capacity} seats</td>
                <td className="px-3 py-2">{v.image ? <img src={v.image} alt={v.name} className="h-8 w-8 rounded object-cover" /> : <span className="text-xs text-[#ccc]">—</span>}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => start(v)} className="rounded border border-[#e1e1e3] px-2 py-1 hover:bg-[#f5f5f5]" aria-label={`Edit ${v.name}`}><Pencil size={14} /></button>{' '}
                  <button onClick={() => remove(v)} className="rounded border border-[#f0c9c0] px-2 py-1 text-[#a13d2c] hover:bg-[#fdf0ec]" aria-label={`Delete ${v.name}`}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (<tr><td colSpan={5} className="px-4 py-8 text-center text-[#616161]">No vehicle types yet. Create Swift, Sedan, or Tempo Traveller to start.</td></tr>)}
          </tbody>
        </table>
      </div>
      {reordering && <p className="text-xs text-[#24584a]">Updating order...</p>}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="mx-auto w-full max-w-lg space-y-4 rounded-[8px] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing ? 'Edit vehicle type' : 'New vehicle type'}</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <label className="block text-sm font-semibold">
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Swift, Sedan, Tempo Traveller..." className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Capacity (passengers)
              <input type="number" min={1} max={60} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" />
            </label>
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