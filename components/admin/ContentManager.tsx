'use client';

import Link from 'next/link';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, Bold, Code2, Edit3, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Pencil, Plus, Quote, Save, Trash2, Upload, X, type LucideIcon } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';

type Category = 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY';
type Section = Category | 'PACKAGE';
type Listing = { id: string; title: string; slug: string; category: Category; location: string; address?: string; sellPrice: string | number; basePrice: string | number; bikeQuantity?: number; scootyQuantity?: number; status: string; description: string; images?: string[]; amenities?: string[]; details?: Record<string, unknown>; seoTitle?: string; seoDescription?: string; cancellationPolicy?: string; featured?: boolean; partnerId?: string; partner?: { businessName: string } };
type TravelPackage = { id: string; title: string; description: string; price: string | number; listingIds?: string[] };
type Partner = { id: string; businessName: string; category: Category; verificationStatus: string };
type Form = { slug: string; title: string; description: string; location: string; address: string; basePrice: string; sellPrice: string; bikeQuantity: string; scootyQuantity: string; images: string[]; amenities: string[]; status: string; price: string; listingIds: string[]; details: Record<string, unknown>; seoTitle: string; seoDescription: string; cancellationPolicy: string; featured: boolean; partnerId: string };

const tabs: { key: Section; label: string }[] = [
  { key: 'STAY', label: 'Stays' },
  { key: 'RIDE', label: 'Rides' },
  { key: 'RENTAL', label: 'Rentals' },
  { key: 'ACTIVITY', label: 'Activities' },
  { key: 'PACKAGE', label: 'Packages' },
];

const freshForm = (): Form => ({
  slug: '',
  title: '',
  description: '',
  location: '',
  basePrice: '',
  sellPrice: '',
  bikeQuantity: '0',
  scootyQuantity: '0',
  images: [],
  amenities: [],
  status: 'DRAFT',
  price: '',
  listingIds: [],
  address: '', details: {}, seoTitle: '', seoDescription: '', cancellationPolicy: 'FLEXIBLE', featured: false, partnerId: '',
});

const normalizeHtml = (html: string) => {
  if (typeof DOMParser === 'undefined') return html;
  const document = new DOMParser().parseFromString(html || '<p></p>', 'text/html');
  document.querySelectorAll('script, style, link, meta, title, head').forEach((element) => element.remove());
  return document.body.innerHTML.trim() || '<p></p>';
};

export function ContentManager({ initialSection = 'STAY' }: { initialSection?: Section }) {
  const [section, setSection] = useState<Section>(initialSection);
  const [items, setItems] = useState<Listing[]>([]);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [form, setForm] = useState<Form>(freshForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch(section === 'PACKAGE' ? '/api/admin/packages' : `/api/admin/listings?category=${section}`, { cache: 'no-store' });
    if (!response.ok) {
      setMessage('Could not load this section. Check admin access and database connection.');
      return;
    }
    if (section === 'PACKAGE') setPackages(await response.json());
    else setItems(await response.json());
  };

  const loadAllListings = async () => {
    const response = await fetch('/api/admin/listings', { cache: 'no-store' });
    if (response.ok) setAllListings(await response.json());
  };

  useEffect(() => {
    setEditing(null);
    setShowForm(false);
    setForm(freshForm());
    setMessage('');
    load();
    if (section === 'PACKAGE') loadAllListings();
    if (section !== 'PACKAGE') fetch('/api/admin/partners', { cache: 'no-store' }).then((response) => response.ok ? response.json() : []).then(setPartners).catch(() => setPartners([]));
  }, [section]);

  const change = (key: keyof Form, value: string | string[]) => setForm((current) => ({ ...current, [key]: value }));

  const add = () => {
    setEditing(null);
    setForm(freshForm());
    setShowForm(true);
    setMessage('');
  };

  const edit = (item: Listing | TravelPackage) => {
    setEditing(item.id);
    if (section === 'PACKAGE') {
      const packageItem = item as TravelPackage;
      setForm({
        ...freshForm(),
        title: packageItem.title,
        description: packageItem.description,
        price: String(packageItem.price),
        listingIds: packageItem.listingIds || [],
      });
    } else {
      const listing = item as Listing;
      setForm({
        ...freshForm(),
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        location: listing.location,
        basePrice: String(listing.basePrice),
        sellPrice: String(listing.sellPrice),
        bikeQuantity: String(listing.bikeQuantity || 0),
        scootyQuantity: String(listing.scootyQuantity || 0),
        images: listing.images || [],
        amenities: listing.amenities || [],
        status: listing.status,
        address: listing.address || '', details: listing.details || {}, seoTitle: listing.seoTitle || '', seoDescription: listing.seoDescription || '', cancellationPolicy: listing.cancellationPolicy || 'FLEXIBLE', featured: Boolean(listing.featured), partnerId: listing.partnerId || '',
      });
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => {
    setEditing(null);
    setShowForm(false);
    setForm(freshForm());
  };

  const toggle = (id: string) => setForm((current) => ({
    ...current,
    listingIds: current.listingIds.includes(id) ? current.listingIds.filter((value) => value !== id) : [...current.listingIds, id],
  }));

  const savePackage = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const payload = {
      title: form.title.trim() || 'Untitled package',
      description: form.description || '',
      price: Number(form.price || 0),
      listingIds: form.listingIds,
    };

    try {
      const endpoint = `/api/admin/packages${editing ? `/${editing}` : ''}`;
      const response = await fetch(endpoint, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || 'Could not save this package.');
        return;
      }
      cancel();
      setMessage(editing ? 'Package updated successfully.' : 'Package added successfully.');
      load();
    } catch {
      setMessage('Could not reach the package service.');
    } finally {
      setBusy(false);
    }
  };

  const saveListing = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const asList = (value: string[]) => value.map((item) => item.trim()).filter(Boolean);
    const details = { ...form.details };
    const payload = {
      slug: form.slug,
      category: section,
      title: form.title,
      description: form.description,
      location: form.location,
      basePrice: Number(form.basePrice),
      sellPrice: Number(form.sellPrice),
      ...(section === 'RENTAL' ? { bikeQuantity: Number(form.bikeQuantity), scootyQuantity: Number(form.scootyQuantity) } : {}),
      images: asList(form.images), amenities: asList(form.amenities), address: form.address, details,
      seoTitle: form.seoTitle, seoDescription: form.seoDescription, cancellationPolicy: form.cancellationPolicy, featured: form.featured, partnerId: form.partnerId,
      status: String(form.status || 'DRAFT').trim().toUpperCase(),
    };
    const endpoint = `/api/admin/listings${editing ? `/${editing}` : ''}`;
    try {
      const response = await fetch(endpoint, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || 'Could not save this listing.');
        return;
      }
      cancel();
      setMessage(editing ? 'Listing updated successfully.' : 'Listing added successfully.');
      load();
    } catch {
      setMessage('Could not reach the listing service.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    if (section === 'PACKAGE') return savePackage(event);
    return saveListing(event);
  };

  const remove = async (id: string, packageMode = false) => {
    if (!window.confirm('Delete this item permanently?')) return;
    const response = await fetch(`/api/admin/${packageMode ? 'packages' : 'listings'}/${id}`, { method: 'DELETE' });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? 'Deleted successfully.' : result.error || 'Could not delete this item.');
    if (response.ok) load();
  };

  const label = section === 'PACKAGE' ? 'package' : section.toLowerCase();
  const records = section === 'PACKAGE' ? packages : items;

  if (showForm) {
    return section === 'PACKAGE' ? (
      <PackageEditor
        form={form}
        setForm={setForm}
        allListings={allListings}
        toggle={toggle}
        editing={Boolean(editing)}
        busy={busy}
        message={message}
        cancel={cancel}
        save={submit}
      />
    ) : (
      <ListingEditor
        form={form}
        setForm={setForm}
        category={section}
        partners={partners}
        busy={busy}
        message={message}
        cancel={cancel}
        save={submit}
      />
    );
  }

  return (
    <section className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7">
      <div className="mb-4 flex items-center gap-2 text-[12px] text-[#616161]">
        <Link href="/admin" className="inline-flex items-center gap-2 rounded-[4px] border border-[#d9d9dc] bg-[#f9f9f9] px-3 py-2 font-semibold hover:bg-[#f4f4f4]"><ArrowLeft size={14} /> Back</Link>
        <span className="text-[#b4b4b7]">/</span>
        <span className="font-medium text-[#676767]">Operations</span>
        <span className="text-[#b4b4b7]">/</span>
        <span className="font-semibold text-[#303030]">Content</span>
      </div>

      <div className="flex flex-col gap-4 border-b border-[#e4e3da] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="sans text-xs font-bold uppercase tracking-[.16em] text-[#b66b45]">Content management</p>
          <h2 className="mt-2 text-2xl text-[#173f35]">{tabs.find((tab) => tab.key === section)?.label} inventory</h2>
          <p className="mt-1 sans text-sm text-[#6c7770]">Existing records appear below. Add, edit, publish, pause, or delete them.</p>
        </div>
        <button type="button" onClick={add} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#b66b45] px-4 py-3 sans text-sm font-bold text-white hover:bg-[#9f5938]"><Plus size={16} /> Add new {label}</button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setSection(tab.key)} className={`shrink-0 rounded-full px-4 py-2 sans text-xs font-bold ${section === tab.key ? 'bg-[#173f35] text-white' : 'bg-[#e7eadf] text-[#24584a]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 rounded-xl bg-[#e2eee7] p-3 sans text-sm text-[#24584a]">{message}</p>}

      <div className="mt-6 divide-y divide-[#e4e3da]">
        {records.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate font-bold text-[#173f35]">{item.title}</h3>
              <p className="mt-1 sans text-sm text-[#6c7770]">
                {section === 'PACKAGE'
                  ? `₹${Number((item as TravelPackage).price).toLocaleString('en-IN')} · ${(item as TravelPackage).listingIds?.length || 0} included listings`
                  : `${(item as Listing).location} · ₹${Number((item as Listing).sellPrice).toLocaleString('en-IN')} · ${(item as Listing).status}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => edit(item)} className="inline-flex items-center gap-2 rounded-full border border-[#d9d9dc] bg-white px-3 py-2 text-[12px] font-semibold text-[#173f35] hover:bg-[#f4f4f4]"><Pencil size={14} /> Edit</button>
              <button type="button" onClick={() => remove(item.id, section === 'PACKAGE')} className="inline-flex items-center gap-2 rounded-full border border-[#e2b5b5] bg-[#fff6f6] px-3 py-2 text-[12px] font-semibold text-[#a44a4a] hover:bg-[#fff0f0]"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, hint, required = false, error }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; multiline?: boolean; hint?: string; required?: boolean; error?: string }) {
  return (
    <label className={`grid gap-2 sans text-sm font-bold text-[#173f35] ${multiline ? 'md:col-span-2' : ''}`}>
      <span className="flex items-center gap-2">
        {label}
        {hint && <span className="font-normal text-[#6c7770]">{hint}</span>}
      </span>
      {multiline ? (
        <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-24 rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" />
      ) : (
        <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" />
      )}
      {error && <span className="text-xs font-normal text-[#9f3d3d]">{error}</span>}
    </label>
  );
}

function ListingEditor({ form, setForm, category, partners, busy, message, cancel, save }: { form: Form; setForm: Dispatch<SetStateAction<Form>>; category: Category; partners: Partner[]; busy: boolean; message: string; cancel: () => void; save: (event: React.FormEvent) => void }) {
  const [uploading, setUploading] = useState(false); const [uploadMessage, setUploadMessage] = useState(''); const [rawHtml, setRawHtml] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({});
  const editor = useEditor({ extensions: [StarterKit.configure({ link: false }), ImageExtension, TiptapLink.configure({ openOnClick: false })], content: form.description || '<p></p>', onUpdate: ({ editor: current }) => setForm((value) => ({ ...value, description: current.getHTML() })), editorProps: { attributes: { class: 'prose min-h-[220px] max-w-none p-4 outline-none' } } });
  const setDetail = (key: string, value: string | number) => setForm((current) => ({ ...current, details: { ...current.details, [key]: value } }));
  const detail = (key: string) => String(form.details[key] ?? '');
  const upload = async (file: File) => { const data = new FormData(); data.append('file', file); const response = await fetch('/api/admin/media', { method: 'POST', body: data }); const result = await response.json().catch(() => ({})); return response.ok && typeof result.asset?.url === 'string' ? result.asset.url : null; };
  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files || []); event.target.value = ''; if (!files.length) return; setUploading(true); const urls: string[] = []; for (const file of files) { const url = await upload(file); if (url) urls.push(url); else setUploadMessage(`Could not upload ${file.name}.`); } if (urls.length) setForm((current) => ({ ...current, images: [...current.images, ...urls] })); setUploading(false); };
  const uploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setUploading(true); const url = await upload(file); if (url) setForm((current) => ({ ...current, details: { ...current.details, videoUrl: url } })); else setUploadMessage('Could not upload the tour video.'); setUploading(false); };
  const amenities = ['WiFi', 'Mountain view', 'Breakfast included', 'Parking', 'Bonfire', 'Hot water'];
  const toggleAmenity = (value: string) => setForm((current) => ({ ...current, amenities: current.amenities.includes(value) ? current.amenities.filter((item) => item !== value) : [...current.amenities, value] }));
  const moveImage = (index: number, offset: number) => setForm((current) => { const images = [...current.images]; const target = index + offset; [images[index], images[target]] = [images[target], images[index]]; return { ...current, images }; });
  const margin = Number(form.sellPrice || 0) - Number(form.basePrice || 0);
  const submit = (event: React.FormEvent) => { event.preventDefault(); const next: Record<string, string> = {}; if (!form.title.trim()) next.title = 'Title is required.'; if (!form.location.trim()) next.location = 'Location is required.'; if (!form.address.trim()) next.address = 'Full address is required.'; if (!form.basePrice) next.basePrice = 'Base price is required.'; if (!form.sellPrice) next.sellPrice = 'Selling price is required.'; if (margin < 0) next.sellPrice = 'Selling price must be at least the base price.'; if (!form.partnerId) next.partnerId = 'Partner is required.'; if (category === 'STAY' && !detail('maxGuests')) next.maxGuests = 'Max guests is required.'; setErrors(next); if (!Object.keys(next).length) save(event); };
  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7">
      {message && <p className="mb-4 rounded-xl bg-[#e2eee7] p-3 sans text-sm text-[#24584a]">{message}</p>}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-[#616161]">
          <button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Back</button>
          <span>/ listing editor</span>
        </div>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 bg-[#173f35] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"><Save size={14} /> Save</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" required error={errors.title} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Enter listing title" />
        <Field label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} placeholder="listing-slug" />
        <Field label="Location" required error={errors.location} value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} placeholder="Bhimtal, Kumaon" />
        <Field label="Full address" required error={errors.address} value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} placeholder="Road, landmark, city" />
        <label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal"><option value="DRAFT">Draft</option><option value="LIVE">Live</option><option value="PAUSED">Paused</option><option value="PENDING_REVIEW">Pending review</option></select></label>
        <label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Partner / owner<select required value={form.partnerId} onChange={(event) => setForm((current) => ({ ...current, partnerId: event.target.value }))} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal"><option value="">Select partner</option>{partners.filter((partner) => partner.category === category || partner.category === 'STAY').map((partner) => <option key={partner.id} value={partner.id}>{partner.businessName}</option>)}</select>{errors.partnerId && <span className="text-xs font-normal text-[#9f3d3d]">{errors.partnerId}</span>}</label>
        <Field label="Base price" required error={errors.basePrice} type="number" value={form.basePrice} onChange={(value) => setForm((current) => ({ ...current, basePrice: value }))} placeholder="0" />
        <Field label="Selling price" required error={errors.sellPrice} type="number" value={form.sellPrice} onChange={(value) => setForm((current) => ({ ...current, sellPrice: value }))} placeholder="0" />
        <p className={`self-end text-sm ${margin < 0 ? 'text-[#9f3d3d]' : 'text-[#6c7770]'}`}>Margin: ₹{margin.toLocaleString('en-IN')}</p>
        {category === 'STAY' && <><Field label="Max guests" required error={errors.maxGuests} type="number" value={detail('maxGuests')} onChange={(value) => setDetail('maxGuests', Number(value))} placeholder="2" /><Field label="Bedrooms" type="number" value={detail('bedrooms')} onChange={(value) => setDetail('bedrooms', Number(value))} placeholder="1" /><Field label="Bathrooms" type="number" value={detail('bathrooms')} onChange={(value) => setDetail('bathrooms', Number(value))} placeholder="1" /><Field label="Check-in time" value={detail('checkIn')} onChange={(value) => setDetail('checkIn', value)} placeholder="14:00" /><Field label="Check-out time" value={detail('checkOut')} onChange={(value) => setDetail('checkOut', value)} placeholder="11:00" /></>}
        {category === 'RENTAL' && <><Field label="Vehicle type" value={detail('vehicleType')} onChange={(value) => setDetail('vehicleType', value)} placeholder="Bike or scooty" /><Field label="Model" value={detail('model')} onChange={(value) => setDetail('model', value)} placeholder="Classic 350" /><Field label="Fuel type" value={detail('fuelType')} onChange={(value) => setDetail('fuelType', value)} placeholder="Petrol" /><Field label="Pickup location" value={detail('pickupLocation')} onChange={(value) => setDetail('pickupLocation', value)} placeholder="Bhimtal market" /><Field label="Bike quantity" type="number" value={form.bikeQuantity} onChange={(value) => setForm((current) => ({ ...current, bikeQuantity: value }))} placeholder="0" /><Field label="Scooty quantity" type="number" value={form.scootyQuantity} onChange={(value) => setForm((current) => ({ ...current, scootyQuantity: value }))} placeholder="0" /></>}
        {category === 'RIDE' && <><Field label="Route / pickup" value={detail('route')} onChange={(value) => setDetail('route', value)} placeholder="Bhimtal to Kainchi Dham" /><Field label="Vehicle type" value={detail('vehicleType')} onChange={(value) => setDetail('vehicleType', value)} placeholder="SUV" /><Field label="Passenger capacity" type="number" value={detail('capacity')} onChange={(value) => setDetail('capacity', Number(value))} placeholder="4" /></>}
        {category === 'ACTIVITY' && <><Field label="Duration" value={detail('duration')} onChange={(value) => setDetail('duration', value)} placeholder="3 hours" /><Field label="Group size / slots" type="number" value={detail('capacity')} onChange={(value) => setDetail('capacity', Number(value))} placeholder="8" /><Field label="Safety requirements" value={detail('safety')} onChange={(value) => setDetail('safety', value)} placeholder="Closed shoes" /><Field label="Difficulty" value={detail('difficulty')} onChange={(value) => setDetail('difficulty', value)} placeholder="Easy" /></>}
        <div className="md:col-span-2"><label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Description<div className="rounded-xl border border-[#d6d9d1] bg-white"><div className="flex gap-1 border-b border-[#e1e1e3] bg-[#fafafa] p-2"><button type="button" title="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} className="p-2 font-bold">B</button><button type="button" title="Heading 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="p-2 font-bold">H2</button><button type="button" title="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="p-2">List</button><button type="button" onClick={() => setRawHtml((value) => !value)} className="p-2 text-xs font-bold">HTML</button></div>{rawHtml ? <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[220px] w-full p-4 font-mono text-xs" /> : <EditorContent editor={editor} />}</div></label></div>
        <div className="md:col-span-2 grid gap-2 sans text-sm font-bold text-[#173f35]"><span>Amenities</span><div className="flex flex-wrap gap-2">{amenities.map((amenity) => <label key={amenity} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-normal"><input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />{amenity}</label>)}<input placeholder="Custom amenity + Enter" onKeyDown={(event) => { if (event.key === 'Enter' && event.currentTarget.value.trim()) { event.preventDefault(); toggleAmenity(event.currentTarget.value.trim()); event.currentTarget.value = ''; } }} className="rounded-full border px-3 py-2 text-xs font-normal" /></div></div>
        <div className="md:col-span-2 grid gap-3 rounded-xl border p-4"><div className="flex items-center justify-between"><strong className="sans text-sm">Gallery</strong><label className="inline-flex cursor-pointer items-center gap-2 bg-[#173f35] px-3 py-2 text-xs text-white"><Upload size={14} /> Upload images<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={uploadImages} className="hidden" /></label></div>{form.images.map((image, index) => <div key={image} className="flex items-center gap-2"><img src={image} alt="" className="h-14 w-20 rounded object-cover" /><span className="min-w-0 flex-1 truncate text-xs font-normal">{index === 0 ? 'Featured: ' : ''}{image}</span><button type="button" disabled={!index} onClick={() => moveImage(index, -1)} className="border px-2">↑</button><button type="button" disabled={index === form.images.length - 1} onClick={() => moveImage(index, 1)} className="border px-2">↓</button></div>)}</div>
        <label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Tour video<input type="file" accept="video/mp4,video/quicktime" disabled={uploading} onChange={uploadVideo} className="rounded-xl border p-3 text-xs font-normal" />{detail('videoUrl') && <video src={detail('videoUrl')} controls className="max-h-32 rounded" />}</label><label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Cancellation policy<select value={form.cancellationPolicy} onChange={(event) => setForm((current) => ({ ...current, cancellationPolicy: event.target.value }))} className="rounded-xl border p-3 font-normal"><option value="FLEXIBLE">Flexible</option><option value="MODERATE">Moderate</option><option value="STRICT">Strict</option></select></label>
        <Field label="SEO title" value={form.seoTitle} onChange={(value) => setForm((current) => ({ ...current, seoTitle: value }))} placeholder="Search title" /><Field label="SEO meta description" value={form.seoDescription} onChange={(value) => setForm((current) => ({ ...current, seoDescription: value }))} placeholder="Search description" /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} /> Featured listing</label><p className="text-sm text-[#24584a]">Availability and date pricing can be managed from the Listings availability view.</p>{uploadMessage && <p className="md:col-span-2 text-xs text-[#9f3d3d]">{uploadMessage}</p>}
      </div>
    </form>
  );
}

function PackageEditor({ form, setForm, allListings, toggle, editing, busy, message, cancel, save }: { form: Form; setForm: Dispatch<SetStateAction<Form>>; allListings: Listing[]; toggle: (id: string) => void; editing: boolean; busy: boolean; message: string; cancel: () => void; save: (event: React.FormEvent) => void }) {
  const [source, setSource] = useState(() => /<!doctype\s+html|<html[\s>]/i.test(form.description));
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), ImageExtension, TiptapLink.configure({ openOnClick: false })],
    content: form.description || '<p></p>',
    onUpdate: ({ editor: current }) => setForm((currentForm) => ({ ...currentForm, description: current.getHTML() })),
    editorProps: { attributes: { class: 'prose min-h-[220px] max-w-none p-4 outline-none' } },
  });

  useEffect(() => {
    if (!source && editor) {
      const content = normalizeHtml(form.description || '<p></p>');
      if (editor.getHTML() !== content) editor.commands.setContent(content, { emitUpdate: false });
      if (content !== form.description) setForm((current) => ({ ...current, description: content }));
    }
  }, [editor, form.description, source, setForm]);

  const active = (name: string) => Boolean(editor?.isActive(name));
  const uploadImage = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch('/api/admin/media', { method: 'POST', body: data });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return typeof result.asset?.url === 'string' ? result.asset.url : null;
  };

  const insertUploadedImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    const imageUrl = await uploadImage(file);
    if (imageUrl) editor.chain().focus().setImage({ src: imageUrl }).run();
    event.target.value = '';
  };

  const tools: [LucideIcon, string, string, () => void][] = [
    [Bold, 'Bold', 'bold', () => editor?.chain().focus().toggleBold().run()],
    [Italic, 'Italic', 'italic', () => editor?.chain().focus().toggleItalic().run()],
    [List, 'Bulleted list', 'bulletList', () => editor?.chain().focus().toggleBulletList().run()],
    [ListOrdered, 'Numbered list', 'orderedList', () => editor?.chain().focus().toggleOrderedList().run()],
    [Quote, 'Quote', 'blockquote', () => editor?.chain().focus().toggleBlockquote().run()],
    [LinkIcon, 'Link', 'link', () => {
      const url = window.prompt('Link URL');
      if (url) editor?.chain().focus().setLink({ href: url }).run();
    }],
  ];

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7">
      {message && <p className="mb-5 rounded-[4px] border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
      <div className="mb-5 flex items-center justify-between gap-3 text-[12px] text-[#616161]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Packages</button>
          <span>/ package {editing ? 'editor' : 'creator'}</span>
        </div>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 bg-[#173f35] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-70"><Save size={14} /> Save</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Field label="Package title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Bhimtal weekend escape" />
          <Field label="Package price" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} placeholder="0" />
          <div className="rounded-2xl border border-[#d9d9dc] bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#e1e1e3] bg-[#fafafa] p-2">
              {tools.map(([Icon, label, mark, onClick]) => (
                <button type="button" key={label} title={label} aria-label={label} aria-pressed={active(mark)} onClick={onClick} className={`grid h-8 w-8 place-items-center transition ${active(mark) ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}>
                  <Icon size={15} />
                </button>
              ))}
              <button type="button" title="Heading 2" aria-pressed={active('heading')} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`h-8 w-8 text-xs font-bold transition ${active('heading') ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}>
                H2
              </button>
              <label title="Insert image" className="grid h-8 w-8 cursor-pointer place-items-center hover:bg-[#e9e9eb]">
                <ImagePlus size={15} />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={insertUploadedImage} />
              </label>
              <button type="button" title="HTML source" aria-pressed={source} onClick={() => setSource((value) => !value)} className={`grid h-8 w-8 place-items-center transition ${source ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}>
                <Code2 size={15} />
              </button>
            </div>
            {source ? (
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[220px] w-full p-4 font-mono text-[12px] outline-none" />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-2xl border border-[#d9d9dc] bg-[#fafaf8] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#7d847c]">Included stays</p>
            <div className="mt-3 space-y-2">
              {allListings.length ? allListings.map((listing) => (
                <label key={listing.id} className="flex items-center gap-2 rounded-xl border border-[#e5e5e4] bg-white p-2 text-[12px] text-[#2d4037]">
                  <input type="checkbox" checked={form.listingIds.includes(listing.id)} onChange={() => toggle(listing.id)} className="h-4 w-4" />
                  <span>{listing.title}</span>
                </label>
              )) : <p className="text-[12px] text-[#6c7770]">No listings available yet.</p>}
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
