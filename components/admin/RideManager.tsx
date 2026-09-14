'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, ImagePlus, X, Upload, Check, GripVertical, Star, Video, Link2 } from 'lucide-react';
import { slugifyRideTitle } from '@/lib/rides';
import { isVideoUrl as isVideoMedia } from '@/lib/media';

export type RideMgrVehicle = { id: string; name: string; capacity: number; image: string | null; order: number };
export type RideMgrRow = {
  id: string;
  slug: string;
  title: string;
  type: 'SIGHTSEEING' | 'TRANSFER';
  description: string;
  fromLocation: string | null;
  toLocation: string | null;
  distanceKm: number | null;
  durationDays: number | null;
  images: string[];
  status: 'DRAFT' | 'LIVE' | 'PAUSED';
  order: number;
  stops: { label: string; note: string }[];
  fares: { vehicleTypeId: string; price: number }[];
};

export type RideMgrForm = {
  title: string;
  slug: string;
  type: 'SIGHTSEEING' | 'TRANSFER';
  description: string;
  fromLocation: string;
  toLocation: string;
  distanceKm: string;
  durationDays: string;
  images: string[];
  status: 'DRAFT' | 'LIVE' | 'PAUSED';
  stops: { label: string; note: string }[];
  vehicles: { vehicleTypeId: string; price: string }[];
};

export const blankRideForm = (): RideMgrForm => ({
  title: '',
  slug: '',
  type: 'SIGHTSEEING',
  description: '',
  fromLocation: '',
  toLocation: '',
  distanceKm: '',
  durationDays: '',
  images: [],
  status: 'DRAFT',
  stops: [{ label: '', note: '' }],
  vehicles: [],
});
export const rideMinFare = (fares: { price: number }[]) => { const v = fares.map((f) => Number(f.price)).filter((p) => Number.isFinite(p) && p > 0); return v.length ? Math.min(...v) : null; };
export function RideManager() {
  const [routes, setRoutes] = useState<RideMgrRow[]>([]);
  const [vehicles, setVehicles] = useState<RideMgrVehicle[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<RideMgrForm>(blankRideForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addVehicleId, setAddVehicleId] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<{ id: string; url: string; filename: string; thumbnailUrl: string | null }[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [mediaDragIndex, setMediaDragIndex] = useState<number | null>(null);
  
  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const dragNode = useRef<HTMLTableRowElement | null>(null);

  // Update order in database
  const updateOrder = async (updatedRoutes: RideMgrRow[]) => {
    setReordering(true);
    try {
      const response = await fetch('/api/admin/rides/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routes: updatedRoutes.map((r, index) => ({ id: r.id, order: index })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Could not update order.');
      } else {
        setMessage('Order updated.');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch {
      setError('Could not update order.');
    } finally {
      setReordering(false);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, routeId: string) => {
    setDraggedId(routeId);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Add dragging style after a small delay
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, routeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== routeId) {
      setDragOverId(routeId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    setDraggedId(null);
    
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    dragNode.current = null;

    if (!draggedId || draggedId === targetId) return;

    const newRoutes = [...routes];
    const draggedIndex = newRoutes.findIndex((r) => r.id === draggedId);
    const targetIndex = newRoutes.findIndex((r) => r.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at new position
    const [draggedItem] = newRoutes.splice(draggedIndex, 1);
    newRoutes.splice(targetIndex, 0, draggedItem);

    // Update order values based on new positions
    const updatedRoutes = newRoutes.map((route, index) => ({
      ...route,
      order: index,
    }));

    setRoutes(updatedRoutes);
    updateOrder(updatedRoutes);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    setDraggedId(null);
    setDragOverId(null);
    dragNode.current = null;
  };
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const q = params.toString();
      const [routeRes, vehicleRes] = await Promise.all([
        fetch(`/api/admin/rides${q ? `?${q}` : ''}`, { cache: 'no-store' }),
        fetch('/api/admin/vehicle-types', { cache: 'no-store' }),
      ]);
      if (!routeRes.ok || !vehicleRes.ok) throw new Error('Ride routes could not be loaded.');
      setRoutes(await routeRes.json());
      setVehicles(await vehicleRes.json());
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Ride routes could not be loaded.'); }
  }, [typeFilter, statusFilter, search]);
  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const res = await fetch('/api/admin/media?type=images&page=1', { cache: 'no-store' });
      if (res.ok) {
        const result = await res.json();
        setMediaAssets(Array.isArray(result.assets) ? result.assets : []);
      }
    } catch { /* ignore */ } finally { setMediaLoading(false); }
  }, []);
  const openMediaPicker = () => { setShowMediaPicker(true); loadMedia(); };
  const appendMediaUrls = (urls: string[]) => setForm((current) => ({ ...current, images: [...current.images, ...urls.filter((url) => url && !current.images.includes(url))] }));
  const uploadMedia = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    const knownUrls = new Set(mediaAssets.map((asset) => asset.url));
    const collected: string[] = [];
    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        const res = await fetch('/api/admin/media', { method: 'POST', body: data });
        const result = await res.json().catch(() => ({}));
        const url = result?.asset?.url || result?.url || result?.filename || (Array.isArray(result?.assets) ? result.assets[0]?.url : '');
        if (typeof url === 'string' && url) collected.push(url);
      }
      if (!collected.length) {
        // Unknown response shape — diff the refreshed media library instead.
        const res = await fetch('/api/admin/media?type=images&page=1', { cache: 'no-store' });
        if (res.ok) {
          const result = await res.json();
          const assets = Array.isArray(result.assets) ? result.assets : [];
          assets.forEach((asset: { url: string }) => { if (!knownUrls.has(asset.url)) collected.push(asset.url); });
          setMediaAssets(assets);
        }
      }
      appendMediaUrls(collected);
    } catch { /* ignore */ } finally { setUploading(false); }
  };
  const addMediaUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch { setUrlError('Enter a valid URL starting with http:// or https://.'); return; }
    setUrlError('');
    setUrlInput('');
    appendMediaUrls([url]);
  };
  const selectMediaUrl = (url: string) => {
    appendMediaUrls([url]);
    setShowMediaPicker(false);
  };
  const removeImage = (index: number) => setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  const makeCover = (index: number) => setForm({ ...form, images: [form.images[index], ...form.images.filter((_, i) => i !== index)] });
  const moveImage = (from: number, to: number) => {
    setForm((current) => {
      const next = [...current.images];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...current, images: next };
    });
  };
  useEffect(() => { load(); }, [load]);
  const start = (route?: RideMgrRow) => {
    setMessage(''); setError('');
    if (route) {
      setEditing(route.id);
      const vehicles: { vehicleTypeId: string; price: string }[] = route.fares.map((f) => ({ vehicleTypeId: f.vehicleTypeId, price: String(f.price) }));
      setForm({
        title: route.title,
        slug: route.slug,
        type: route.type,
        description: route.description || '',
        fromLocation: route.fromLocation || '',
        toLocation: route.toLocation || '',
        distanceKm: route.distanceKm === null ? '' : String(route.distanceKm),
        durationDays: route.durationDays === null ? '' : String(route.durationDays),
        images: Array.isArray(route.images) ? route.images : [],
        status: route.status,
        stops: route.stops.length ? route.stops.map((s) => ({ label: s.label, note: s.note || '' })) : [{ label: '', note: '' }],
        vehicles,
      });
    } else {
      setEditing(null);
      setForm(blankRideForm());
    }
    setShowForm(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const payload = {
      title: form.title.trim() || 'Untitled ride',
      slug: form.slug.trim() || slugifyRideTitle(form.title) || `ride-${Date.now()}`,
      type: form.type,
      description: form.description,
      fromLocation: form.fromLocation.trim(),
      toLocation: form.toLocation.trim(),
      distanceKm: form.distanceKm === '' ? null : Number(form.distanceKm),
      durationDays: form.durationDays === '' ? null : Math.round(Number(form.durationDays)),
      images: form.images.filter((img) => img.trim()),
      status: form.status,
      stops: form.stops.map((s) => ({ label: s.label.trim(), note: s.note.trim() })).filter((s) => s.label || s.note),
      fares: form.vehicles.filter((v) => v.vehicleTypeId && Number.isFinite(Number(v.price)) && Number(v.price) > 0).map((v) => ({ vehicleTypeId: v.vehicleTypeId, price: Number(v.price) })),
    };
    try {
      const res = await fetch(editing ? `/api/admin/rides/${editing}` : '/api/admin/rides', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { setError(result.error || 'Could not save this ride route.'); return; }
      setShowForm(false); setEditing(null); setForm(blankRideForm());
      setMessage(editing ? 'Ride route updated.' : 'Ride route created.');
      load();
    } catch { setError('Could not reach the rides service.'); } finally { setBusy(false); }
  };
  const remove = async (route: RideMgrRow) => {
    if (!window.confirm(`Delete "${route.title}"? Its stops and fares go with it.`)) return;
    setError(''); setMessage('');
    try {
      const res = await fetch(`/api/admin/rides/${route.id}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { setError(result.error || 'Could not delete this route.'); return; }
      setMessage('Ride route deleted.'); load();
    } catch { setError('Could not reach the rides service.'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type" className="rounded-[4px] border border-[#e1e1e3] bg-white px-3 py-2 text-sm"><option value="ALL">All types</option><option value="SIGHTSEEING">Sightseeing</option><option value="TRANSFER">Transfer</option></select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="rounded-[4px] border border-[#e1e1e3] bg-white px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="DRAFT">Draft</option><option value="LIVE">Live</option><option value="PAUSED">Paused</option></select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, slug, from/to..." aria-label="Search rides" className="min-w-[200px] flex-1 rounded-[4px] border border-[#e1e1e3] bg-white px-3 py-2 text-sm" />
        <button onClick={() => start()} className="inline-flex items-center gap-2 rounded-[4px] bg-[#24584a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173f35]"><Plus size={15} /> New ride route</button>
      </div>
      {message && <p role="status" className="rounded-[4px] border border-[#b7d8c6] bg-[#e8f5ed] px-3 py-2 text-sm font-semibold text-[#17633e]">{message}</p>}
      {error && <p role="alert" className="rounded-[4px] border border-[#f0c9c0] bg-[#fdf0ec] px-3 py-2 text-sm font-semibold text-[#a13d2c]">{error}</p>}
      <div className="overflow-x-auto rounded-[6px] border border-[#e1e1e3] bg-white">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-[#616161]"><tr><th className="px-4 py-3 w-10"></th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Starting price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody>
            {routes.map((r) => (
              <tr
                key={r.id}
                draggable
                onDragStart={(e) => handleDragStart(e, r.id)}
                onDragOver={(e) => handleDragOver(e, r.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, r.id)}
                onDragEnd={handleDragEnd}
                className={`border-t border-[#eee] cursor-move transition-colors ${
                  dragOverId === r.id ? 'bg-[#e8f5ed]' : ''
                } ${draggedId === r.id ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-[#999] cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                    <span className="text-xs font-mono">{r.order}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><strong>{r.title}</strong><span className="block text-xs text-[#888]">/{r.slug}</span></td>
                <td className="px-4 py-3">{r.type === 'SIGHTSEEING' ? 'Sightseeing' : 'Transfer'}</td>
                <td className="px-4 py-3">{rideMinFare(r.fares) === null ? 'Pricing soon' : `Rs.${rideMinFare(r.fares)!.toLocaleString('en-IN')}`}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => start(r)} className="rounded border border-[#e1e1e3] px-3 py-1.5 hover:bg-[#f5f5f5]">Edit</button> <button onClick={() => remove(r)} className="rounded border border-[#f0c9c0] px-3 py-1.5 text-[#a13d2c] hover:bg-[#fdf0ec]">Delete</button></td>
              </tr>
            ))}
            {routes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[#616161]">No routes yet. Create Kainchi Dham sightseeing first.</td></tr>}
          </tbody>
        </table>
      </div>
      {reordering && <p className="text-sm text-[#24584a]">Updating order...</p>}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="mx-auto w-full max-w-3xl space-y-5 rounded-[8px] bg-white p-6">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{editing ? 'Edit ride route' : 'New ride route'}</h3><button type="button" onClick={() => setShowForm(false)}>Close</button></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold md:col-span-2">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
              <label className="block text-sm font-semibold">Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
              <label className="block text-sm font-semibold">Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'SIGHTSEEING' | 'TRANSFER' })} className="mt-1 w-full rounded border border-[#e1e1e3] bg-white px-3 py-2 font-normal"><option value="SIGHTSEEING">Sightseeing package</option><option value="TRANSFER">Point-to-point transfer</option></select></label>
              <label className="block text-sm font-semibold md:col-span-2">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
              {form.type === 'TRANSFER' && (<>
                <label className="block text-sm font-semibold">From<input value={form.fromLocation} onChange={(e) => setForm({ ...form, fromLocation: e.target.value })} placeholder="Kathgodam Railway Station" className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
                <label className="block text-sm font-semibold">To<input value={form.toLocation} onChange={(e) => setForm({ ...form, toLocation: e.target.value })} placeholder="Bhimtal" className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
                <label className="block text-sm font-semibold">Distance (km)<input type="number" min={0} step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
                <label className="block text-sm font-semibold">Duration (days)<input type="number" min={0} step={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>
              </>)}
              {form.type === 'SIGHTSEEING' && (<label className="block text-sm font-semibold">Total duration (days)<input type="number" min={0} step={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="mt-1 w-full rounded border border-[#e1e1e3] px-3 py-2 font-normal" /></label>)}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Images &amp; videos</p>
                  <p className="text-[11px] font-normal text-[#888]">Drag to reorder — the first item is the cover in the carousel.</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#e1e1e3] px-3 py-1.5 text-sm font-semibold hover:bg-[#f5f5f5]"><Upload size={14} /> Upload
                    <input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) uploadMedia(files); e.target.value = ''; }} />
                  </label>
                  <button type="button" onClick={openMediaPicker} className="inline-flex items-center gap-1 rounded border border-[#e1e1e3] px-3 py-1.5 text-sm font-semibold hover:bg-[#f5f5f5]"><ImagePlus size={14} /> Choose media</button>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded border border-[#e1e1e3] px-2 py-1.5">
                      <Link2 size={13} className="text-[#888]" />
                      <input value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMediaUrl(); } }} placeholder="Add image or video URL" className="w-48 bg-transparent text-sm font-normal outline-none" />
                    </span>
                    <button type="button" onClick={addMediaUrl} className="rounded border border-[#24584a] px-3 py-1.5 text-sm font-semibold text-[#24584a] hover:bg-[#eef3f0]">Add</button>
                  </span>
                </div>
                {urlError && <p className="mt-1 text-xs text-[#a13d2c]">{urlError}</p>}
                {uploading && <p className="mt-1 text-xs text-[#24584a]">Uploading media...</p>}
                {form.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.images.map((img, i) => (
                      <div
                        key={`${img}-${i}`}
                        draggable
                        onDragStart={() => setMediaDragIndex(i)}
                        onDragOver={(e) => { e.preventDefault(); if (mediaDragIndex !== null && mediaDragIndex !== i) moveImage(mediaDragIndex, i); }}
                        onDragEnd={() => setMediaDragIndex(null)}
                        className={`group relative h-20 w-28 cursor-grab overflow-hidden rounded-lg ring-1 ${mediaDragIndex === i ? 'opacity-50 ring-2 ring-[#24584a]' : 'ring-[#e1e1e3]'}`}
                        title="Drag to reorder"
                      >
                        {isVideoMedia(img) ? (
                          <span className="flex h-full w-full items-center justify-center bg-[#1c3833] text-white"><Video size={20} /></span>
                        ) : (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        )}
                        {i === 0 && <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-[#173f35] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"><Star size={9} /> Cover</span>}
                        {isVideoMedia(img) && i !== 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"><Video size={9} className="inline" /> Video</span>}
                        <span className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
                          {i !== 0 && (
                            <button type="button" title="Make cover" aria-label="Make cover" onClick={() => makeCover(i)} className="text-white hover:text-[#ffd479]"><Star size={12} /></button>
                          )}
                          <button type="button" title="Remove" aria-label="Remove media" onClick={() => removeImage(i)} className="ml-auto text-white hover:text-[#ff9d8a]"><X size={12} /></button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="block text-sm font-semibold md:col-span-2">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'DRAFT' | 'LIVE' | 'PAUSED' })} className="mt-1 w-full rounded border border-[#e1e1e3] bg-white px-3 py-2 font-normal"><option value="DRAFT">Draft</option><option value="LIVE">Live</option><option value="PAUSED">Paused</option></select></label>
            </div>
              {form.type === 'SIGHTSEEING' && (
              <div className="rounded-[6px] border border-[#e1e1e3] p-4">
                <p className="text-sm font-bold">Stops / itinerary</p>
                {form.stops.map((s, i) => (
                  <div key={i} className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <input value={s.label} onChange={(e) => setForm({ ...form, stops: form.stops.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder={`Stop ${i + 1}`} className="rounded border border-[#e1e1e3] px-3 py-2 text-sm" />
                    <input value={s.note} onChange={(e) => setForm({ ...form, stops: form.stops.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} placeholder="Optional note" className="rounded border border-[#e1e1e3] px-3 py-2 text-sm" />
                    <button type="button" onClick={() => setForm({ ...form, stops: form.stops.filter((_, j) => j !== i) })} className="rounded border border-[#f0c9c0] px-3 py-2 text-sm text-[#a13d2c]">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, stops: [...form.stops, { label: '', note: '' }] })} className="mt-3 rounded border border-[#e1e1e3] px-3 py-2 text-sm font-semibold">+ Add stop</button>
              </div>
            )}
            <div className="rounded-[6px] border border-[#e1e1e3] p-4">
              <p className="text-sm font-bold">Vehicles for this ride</p>
              {vehicles.length === 0 && <p className="mt-2 text-sm text-[#888]">Add vehicle types first.</p>}
              {vehicles.length > 0 && (
                <>
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <label className="block flex-1 text-sm font-semibold">
                      Select a vehicle to add
                      <select value={addVehicleId} onChange={(e) => setAddVehicleId(e.target.value)} className="mt-1 w-full rounded border border-[#e1e1e3] bg-white px-3 py-2 font-normal">
                        <option value="">— choose —</option>
                        {vehicles
                          .filter((v) => !form.vehicles.some((fv) => fv.vehicleTypeId === v.id))
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} (up to {v.capacity})
                            </option>
                          ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={!addVehicleId}
                      onClick={() => {
                        if (!addVehicleId) return;
                        if (form.vehicles.some((fv) => fv.vehicleTypeId === addVehicleId)) return;
                        setForm({ ...form, vehicles: [...form.vehicles, { vehicleTypeId: addVehicleId, price: '' }] });
                        setAddVehicleId('');
                      }}
                      className="rounded-[4px] border border-[#24584a] px-3 py-2 text-sm font-semibold text-[#24584a] disabled:opacity-50 hover:bg-[#eef3f0]"
                    >
                      + Add vehicle
                    </button>
                  </div>
                  {form.vehicles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {form.vehicles.map((fv, i) => {
                        const vt = vehicles.find((v) => v.id === fv.vehicleTypeId);
                        return (
                          <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-[#e1e1e3] bg-[#fafafa] px-3 py-2">
                            <span className="flex-1 text-sm font-medium text-[#173f35]">{vt ? `${vt.name} (up to ${vt.capacity})` : fv.vehicleTypeId}</span>
                            <label className="flex items-center gap-1 text-sm font-semibold">
                              ₹
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={fv.price}
                                onChange={(e) => setForm({ ...form, vehicles: form.vehicles.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })}
                                placeholder="Price"
                                className="w-24 rounded border border-[#e1e1e3] px-2 py-1 font-normal"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, vehicles: form.vehicles.filter((_, j) => j !== i) })}
                              className="rounded border border-[#f0c9c0] px-2 py-1 text-xs font-semibold text-[#a13d2c] hover:bg-[#fdf0ec]"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            <button disabled={busy} className="w-full rounded-[4px] bg-[#24584a] px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save ride route'}</button>
          </form>
        </div>
      )}

      {showMediaPicker && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="mx-auto w-full max-w-2xl rounded-[8px] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Choose media</h3>
              <button type="button" onClick={() => setShowMediaPicker(false)} aria-label="Close"><X size={18} /></button>
            </div>
            {uploading && <p className="mt-2 text-sm text-[#24584a]">Uploading...</p>}
            {mediaLoading ? (
              <p className="mt-4 text-center text-sm text-[#616161]">Loading media...</p>
            ) : mediaAssets.length === 0 ? (
              <p className="mt-4 text-center text-sm text-[#616161]">No media found. Upload an image to get started.</p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {mediaAssets.map((asset) => (
                  <button key={asset.id} type="button" onClick={() => selectMediaUrl(asset.url)} className="relative aspect-square overflow-hidden rounded border border-[#e1e1e3] hover:ring-2 hover:ring-[#24584a]">
                    <img src={asset.thumbnailUrl || asset.url} alt={asset.filename} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setShowMediaPicker(false)} className="rounded border border-[#e1e1e3] px-4 py-2 text-sm font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


