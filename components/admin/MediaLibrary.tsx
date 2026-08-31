'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, FileImage, FileVideo, Grid2X2, List, Loader2, Search, Trash2, Upload, X } from 'lucide-react';

type Usage = { type: string; id: string; title: string };
type Asset = { id: string; filename: string; url: string; mimeType: string; size: number; width: number | null; height: number | null; altText: string | null; thumbnailUrl: string | null; createdAt: string; usage: Usage[] };
type UploadState = { name: string; progress: number; error?: string };

const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function MediaLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = async () => {
    const response = await fetch(`/api/admin/media?search=${encodeURIComponent(search)}&type=${type}&sort=${sort}&page=${page}`, { cache: 'no-store' });
    if (!response.ok) { setMessage('Could not load media library.'); return; }
    const result = await response.json(); setAssets(result.assets); setPages(result.pages);
  };
  useEffect(() => { load(); }, [search, type, sort, page]);

  const uploadFile = (file: File) => new Promise<void>((resolve) => {
    const data = new FormData(); data.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media');
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setUploads((current) => current.map((item) => item.name === file.name ? { ...item, progress: Math.round(event.loaded / event.total * 100) } : item)); };
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) { setUploads((current) => current.filter((item) => item.name !== file.name)); load(); } else { let error = 'Upload failed.'; try { error = JSON.parse(xhr.responseText).error || error; } catch {} setUploads((current) => current.map((item) => item.name === file.name ? { ...item, error } : item)); } resolve(); };
    xhr.onerror = () => { setUploads((current) => current.map((item) => item.name === file.name ? { ...item, error: 'Network error.' } : item)); resolve(); };
    xhr.send(data);
  });
  const uploadFiles = (files: FileList | File[]) => { const valid = Array.from(files); setUploads(valid.map((file) => ({ name: file.name, progress: 0 }))); valid.forEach(uploadFile); };

  const remove = async (asset: Asset) => {
    const warning = asset.usage.length ? `Used in ${asset.usage.length} place(s): ${asset.usage.map((item) => `${item.type}: ${item.title}`).join(', ')}. Delete anyway?` : `Delete ${asset.filename}?`;
    if (!window.confirm(warning)) return;
    const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [asset.id] }) });
    const result = await response.json();
    if (response.status === 409 && window.confirm(`${result.error} ${result.usage?.flatMap((item: { references: Usage[] }) => item.references.map((reference) => `${reference.type}: ${reference.title}`)).join(', ')}. Delete anyway?`)) await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [asset.id], force: true }) });
    setSelected(null); load();
  };
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const bulkDelete = async () => {
    if (!selectedIds.length || !window.confirm(`Check usage and delete ${selectedIds.length} selected file(s)?`)) return;
    const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds }) });
    const result = await response.json();
    if (response.status === 409 && window.confirm(`${result.error} Delete the selected files anyway?`)) await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, force: true }) });
    setSelectedIds([]); load();
  };
  const bulkDownload = () => selectedIds.forEach((id) => { const asset = assets.find((item) => item.id === id); if (asset) { const link = document.createElement('a'); link.href = asset.url; link.download = asset.filename; link.target = '_blank'; link.click(); } });

  return <section className="min-h-screen bg-[#f6f6f7]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#777]">Content</p><h1 className="mt-2 text-[26px] font-semibold">Media Library</h1><p className="mt-1 text-[13px] text-[#777]">One home for reusable images and videos.</p></div><button onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center justify-center gap-2 rounded-[4px] bg-[#303030] px-4 text-[12px] font-semibold text-white"><Upload size={15} /> Upload files</button><input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" className="hidden" onChange={(event) => event.target.files && uploadFiles(event.target.files)} /></div>
    <div onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }} className={`mt-6 grid min-h-28 place-items-center border border-dashed p-5 text-center ${dragging ? 'border-[#24584a] bg-[#e9f3ed]' : 'border-[#c8c8cc] bg-white'}`}><FileImage className="text-[#8b8b8f]" size={25} /><p className="mt-2 text-[13px] font-semibold">Drop images or videos here</p><p className="mt-1 text-[12px] text-[#777]">JPG, PNG, WebP up to 10 MB. MP4 and MOV up to 100 MB.</p></div>
    {uploads.length > 0 && <div className="mt-4 grid gap-2">{uploads.map((upload) => <div key={upload.name} className="border border-[#e1e1e3] bg-white p-3"><div className="flex justify-between text-[12px]"><span className="truncate">{upload.name}</span><span>{upload.error || `${upload.progress}%`}</span></div><div className="mt-2 h-1.5 bg-[#ededee]"><div className={`h-full ${upload.error ? 'bg-[#b94b3d]' : 'bg-[#24584a]'}`} style={{ width: `${upload.progress}%` }} /></div></div>)}</div>}
    {message && <p className="mt-4 border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
    <div className="mt-6 flex flex-col gap-3 border border-[#e1e1e3] bg-white p-3 md:flex-row"><label className="flex min-w-0 flex-1 items-center gap-2 border border-[#d9d9dc] px-3"><Search size={16} className="text-[#777]" /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search files" className="h-9 min-w-0 flex-1 text-[13px] outline-none" /></label><select value={type} onChange={(event) => { setPage(1); setType(event.target.value); }} className="h-9 border border-[#d9d9dc] px-3 text-[12px]"><option value="all">All types</option><option value="images">Images</option><option value="videos">Videos</option></select><select value={sort} onChange={(event) => { setPage(1); setSort(event.target.value); }} className="h-9 border border-[#d9d9dc] px-3 text-[12px]"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name A-Z</option><option value="size">Largest</option></select><button aria-label="Grid view" onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-[#e9e9eb]' : ''}`}><Grid2X2 size={17} /></button><button aria-label="List view" onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-[#e9e9eb]' : ''}`}><List size={17} /></button></div>
    {selectedIds.length > 0 && <div className="mt-3 flex items-center gap-2 border border-[#d9d9dc] bg-white p-3 text-[12px]"><strong>{selectedIds.length} selected</strong><button onClick={bulkDownload} className="border border-[#d9d9dc] px-3 py-2">Download</button><button onClick={bulkDelete} className="border border-[#e7b5a6] px-3 py-2 text-[#9f3d3d]">Delete</button></div>}
    {!assets.length ? <div className="border border-[#e1e1e3] bg-white py-16 text-center"><FileImage className="mx-auto text-[#999]" size={30} /><p className="mt-3 text-[14px] font-semibold">No files yet - upload your first image or video</p></div> : view === 'grid' ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{assets.map((asset) => <button key={asset.id} onClick={() => setSelected(asset)} className="group overflow-hidden border border-[#e1e1e3] bg-white text-left"><div className="relative aspect-square bg-[#f0f0f1]">{asset.mimeType.startsWith('video/') ? <video src={asset.url} className="h-full w-full object-cover" muted preload="metadata" /> : <img src={asset.thumbnailUrl || asset.url} alt={asset.altText || ''} className="h-full w-full object-cover" />}<span className="absolute bottom-2 left-2 bg-[#303030]/85 px-2 py-1 text-[10px] text-white">{asset.usage.length ? `Used ${asset.usage.length} time${asset.usage.length === 1 ? '' : 's'}` : 'Unused'}</span></div><div className="p-3"><p className="truncate text-[12px] font-semibold">{asset.filename}</p><p className="mt-1 text-[11px] text-[#777]">{formatSize(asset.size)} - {new Date(asset.createdAt).toLocaleDateString('en-IN')}</p></div></button>)}</div> : <div className="mt-4 overflow-x-auto border border-[#e1e1e3] bg-white"><table className="w-full text-left text-[12px]"><thead className="border-b border-[#e1e1e3] bg-[#fafafa] text-[10px] uppercase text-[#777]"><tr><th className="p-3">File</th><th className="p-3">Type</th><th className="p-3">Size</th><th className="p-3">Dimensions</th><th className="p-3">Uploaded</th><th className="p-3">Usage</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} onClick={() => setSelected(asset)} className="cursor-pointer border-b border-[#eee]"><td className="p-3 font-semibold">{asset.filename}</td><td className="p-3">{asset.mimeType}</td><td className="p-3">{formatSize(asset.size)}</td><td className="p-3">{asset.width && asset.height ? `${asset.width} x ${asset.height}` : '-'}</td><td className="p-3">{new Date(asset.createdAt).toLocaleDateString('en-IN')}</td><td className="p-3">{asset.usage.length}</td></tr>)}</tbody></table></div>}
    {pages > 1 && <div className="mt-5 flex items-center justify-center gap-3 text-[12px]"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="border border-[#d9d9dc] bg-white px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} className="border border-[#d9d9dc] bg-white px-3 py-2 disabled:opacity-40">Next</button></div>}
    {selected && <MediaDetail asset={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} onDelete={() => remove(selected)} />}
  </section>;
}

function MediaDetail({ asset, onClose, onSaved, onDelete }: { asset: Asset; onClose: () => void; onSaved: () => void; onDelete: () => void }) {
  const [filename, setFilename] = useState(asset.filename); const [altText, setAltText] = useState(asset.altText || ''); const [replacement, setReplacement] = useState<File | null>(null); const [saving, setSaving] = useState(false); const [copied, setCopied] = useState(false);
  const save = async () => { setSaving(true); const data = new FormData(); data.append('id', asset.id); data.append('filename', filename); data.append('altText', altText); if (replacement) data.append('file', replacement); await fetch('/api/admin/media', { method: 'PATCH', body: data }); setSaving(false); onSaved(); };
  return <div className="fixed inset-0 z-50 bg-black/25"><aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-[#e1e1e3] bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">File details</h2><button onClick={onClose} aria-label="Close details"><X size={18} /></button></div><div className="mt-5 aspect-video bg-[#f0f0f1]">{asset.mimeType.startsWith('video/') ? <video src={asset.url} controls className="h-full w-full" /> : <img src={asset.url} alt={asset.altText || ''} className="h-full w-full object-contain" />}</div><label className="mt-5 grid gap-1 text-[12px] font-semibold">Filename<input value={filename} onChange={(event) => setFilename(event.target.value)} className="h-9 border border-[#d9d9dc] px-2 text-[13px] font-normal" /></label>{asset.mimeType.startsWith('image/') && <label className="mt-4 grid gap-1 text-[12px] font-semibold">Alt text<input required value={altText} onChange={(event) => setAltText(event.target.value)} className="h-9 border border-[#d9d9dc] px-2 text-[13px] font-normal" /></label>}<div className="mt-4 grid gap-2 text-[12px] text-[#616161]"><p>{asset.mimeType} - {formatSize(asset.size)}</p><p>Used in {asset.usage.length} place(s)</p>{asset.usage.map((item) => <p key={`${item.type}-${item.id}`}>{item.type}: {item.title}</p>)}</div><div className="mt-5 grid gap-2"><button onClick={async () => { await navigator.clipboard.writeText(asset.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center justify-center gap-2 border border-[#d9d9dc] px-3 py-2 text-[12px] font-semibold">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy URL'}</button><label className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d9d9dc] px-3 py-2 text-[12px] font-semibold"><Upload size={14} /> Replace file<input type="file" accept={asset.mimeType.startsWith('video/') ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp'} className="hidden" onChange={(event) => setReplacement(event.target.files?.[0] || null)} /></label><button disabled={saving} onClick={save} className="bg-[#303030] px-3 py-2 text-[12px] font-semibold text-white">{saving ? <Loader2 className="mx-auto animate-spin" size={15} /> : 'Save changes'}</button><button onClick={onDelete} className="inline-flex items-center justify-center gap-2 border border-[#e7b5a6] px-3 py-2 text-[12px] font-semibold text-[#9f3d3d]"><Trash2 size={14} /> Delete file</button></div></aside></div>;
}
