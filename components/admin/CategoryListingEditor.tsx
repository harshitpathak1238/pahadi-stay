'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, GripVertical, ImagePlus, Save, Trash2, Upload } from 'lucide-react';
import type { ListingForm } from './ContentManager';

const categoryNames = { STAY: 'Stay', RIDE: 'Ride', RENTAL: 'Rental', ACTIVITY: 'Activity' } as const;
const valueOf = (details: Record<string, string>, name: string) => details[name] || '';

type Props = {
  category: keyof typeof categoryNames;
  form: ListingForm;
  setForm: Dispatch<SetStateAction<ListingForm>>;
  busy: boolean;
  message: string;
  cancel: () => void;
  save: (event: React.FormEvent) => void;
};

export function CategoryListingEditor({ category, form, setForm, busy, message, cancel, save }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const setDetail = (name: string, value: string) => setForm((current) => ({ ...current, details: { ...current.details, [name]: value } }));

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setUploadMessage('');
    const urls: string[] = [];
    for (const file of files) {
      const body = new FormData();
      body.append('file', file);
      try {
        const response = await fetch('/api/admin/media', { method: 'POST', body });
        const result = await response.json().catch(() => ({}));
        if (response.ok && typeof result.asset?.url === 'string') urls.push(result.asset.url);
        else setUploadMessage(result.error || `Could not upload ${file.name}.`);
      } catch {
        setUploadMessage(`Could not upload ${file.name}.`);
      }
    }
    if (urls.length) setForm((current) => ({ ...current, images: [...current.images, ...urls] }));
    setUploading(false);
  };

  const moveImage = (index: number, offset: number) => setForm((current) => {
    const target = index + offset;
    if (target < 0 || target >= current.images.length) return current;
    const images = [...current.images];
    [images[index], images[target]] = [images[target], images[index]];
    return { ...current, images };
  });
  const setFeatured = (index: number) => setForm((current) => ({ ...current, images: [current.images[index], ...current.images.filter((_, itemIndex) => itemIndex !== index)] }));
  const removeImage = (index: number) => setForm((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }));

  const Input = ({ label, name, required = false, type = 'text', placeholder = '' }: { label: string; name: string; required?: boolean; type?: string; placeholder?: string }) => (
    <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]">
      <span>{label}{required && <b className="ml-1 text-[#a44a4a]">*</b>}</span>
      <input type={type} value={valueOf(form.details, name)} onChange={(event) => setDetail(name, event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-[#d6d9d1] bg-white px-3 font-normal outline-none focus:border-[#24584a]" />
    </label>
  );
  const Textarea = ({ label, name, required = false, placeholder = '' }: { label: string; name: string; required?: boolean; placeholder?: string }) => (
    <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]">
      <span>{label}{required && <b className="ml-1 text-[#a44a4a]">*</b>}</span>
      <textarea value={valueOf(form.details, name)} onChange={(event) => setDetail(name, event.target.value)} placeholder={placeholder} className="min-h-24 rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal outline-none focus:border-[#24584a]" />
    </label>
  );

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7">
      {message && <p className="mb-5 border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-[#616161]"><button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Back</button><span>/ {categoryNames[category]} editor</span></div>
        <button disabled={busy} className="inline-flex items-center gap-2 bg-[#173f35] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"><Save size={14} /> Save</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Title<b className="ml-1 text-[#a44a4a]">*</b></span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Location</span><input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Slug</span><input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="listing-slug" className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Base price<b className="ml-1 text-[#a44a4a">*</b></span><input type="number" min="0" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Selling price<b className="ml-1 text-[#a44a4a">*</b></span><input type="number" min="0" value={form.sellPrice} onChange={(event) => setForm((current) => ({ ...current, sellPrice: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        {category === 'STAY' && <><Input label="Property type" name="propertyType" required placeholder="Homestay, hotel, villa" /><Input label="Room arrangement" name="roomArrangement" required placeholder="Entire place or private room" /><Input label="Full address" name="fullAddress" required /><Input label="Map pin" name="mapPin" required placeholder="Google Maps URL or coordinates" /><Input label="Maximum guests" name="maxGuests" required type="number" /><Input label="Bedrooms" name="bedrooms" required type="number" /><Input label="Beds" name="beds" required type="number" /><Input label="Bathrooms" name="bathrooms" required type="number" /><Input label="Check-in time" name="checkIn" required type="time" /><Input label="Check-out time" name="checkOut" required type="time" /><Input label="Cancellation policy" name="cancellationPolicy" required placeholder="Flexible, moderate, or strict" /><Input label="Amenities" name="amenities" placeholder="Wi-Fi, parking, breakfast" /><Input label="Audience tags" name="audienceTags" placeholder="Families, groups, pets" /><Textarea label="House rules" name="houseRules" /><Textarea label="Neighborhood" name="neighborhood" /></>}
        {category === 'RIDE' && <><Input label="Vehicle type" name="vehicleType" required /><Input label="Passenger capacity" name="passengerCapacity" required type="number" /><Input label="Route or custom pickup" name="route" required /><Input label="Estimated duration" name="duration" /><Textarea label="Driver notes" name="driverNotes" /><Textarea label="Waiting, toll, and fuel notes" name="pricingNotes" /></>}
        {category === 'RENTAL' && <><Input label="Vehicle type" name="vehicleType" required placeholder="Bike or scooty" /><Input label="Make / model" name="makeModel" required /><Input label="Year" name="year" required type="number" /><Input label="Registration / license plate" name="registrationNumber" required /><Input label="Transmission" name="transmission" required /><Input label="Daily price" name="dailyPrice" required type="number" /><Input label="Quantity available" name="quantity" required type="number" /><Input label="Mileage / odometer" name="mileage" /><Input label="Fuel type" name="fuelType" /><Input label="Capacity" name="capacity" /><Input label="Pickup / delivery options" name="pickupOptions" /><Textarea label="Notable features" name="features" placeholder="Helmet included, phone mount" /><Textarea label="FAQ" name="faq" placeholder="Question and answer pairs" /></>}
        {category === 'ACTIVITY' && <><Input label="Minimum group size" name="groupMin" required type="number" /><Input label="Maximum group size" name="groupMax" required type="number" /><Textarea label="What is included" name="included" required /><Textarea label="Safety information" name="safetyInformation" required /><Textarea label="About the guide/operator" name="guideAbout" /><Input label="Duration" name="duration" /><Input label="Meeting point" name="meetingPoint" /></>}
        <label className="grid gap-1 md:col-span-2 text-[12px] font-semibold text-[#173f35]"><span>Description{category !== 'RENTAL' && <b className="ml-1 text-[#a44a4a]">*</b>}</span><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-28 rounded-xl border border-[#d6d9d1] p-3 font-normal" /></label>
        <div className="md:col-span-2">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-semibold text-[#173f35]">Photos <span className="font-normal text-[#6c7770]">{category === 'STAY' || category === 'ACTIVITY' ? 'minimum 5 to publish' : category === 'RENTAL' ? 'minimum 3 to publish' : 'minimum 2 to publish'}</span></p><p className="mt-1 text-[11px] text-[#6c7770]">Use clear photos of the actual listing. Avoid text overlays.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#173f35] px-3 py-2 text-xs font-bold text-white"><Upload size={14} /> {uploading ? 'Uploading...' : 'Upload photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={upload} className="hidden" /></label></div>
          {uploadMessage && <p className="mt-2 text-xs text-[#a44a4a]">{uploadMessage}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{form.images.map((image, index) => <div key={`${image}-${index}`} className="relative overflow-hidden rounded-xl border border-[#d9d9dc] bg-[#f6f6f4]"><img src={image} alt={`${index === 0 ? 'Featured ' : ''}listing photo`} className="aspect-square w-full object-cover" /><div className="flex items-center justify-between gap-1 p-1"><button type="button" title="Move image left" aria-label="Move image left" disabled={index === 0} onClick={() => moveImage(index, -1)} className="p-1 disabled:opacity-30"><GripVertical size={14} /></button><button type="button" onClick={() => setFeatured(index)} className={`px-1 text-[10px] font-semibold ${index === 0 ? 'text-[#16704a]' : 'text-[#616161]'}`}>{index === 0 ? 'Cover' : 'Set cover'}</button><button type="button" title="Remove image" aria-label="Remove image" onClick={() => removeImage(index)} className="p-1 text-[#a44a4a]"><Trash2 size={14} /></button></div></div>)}</div>
          {form.images.length > 0 && form.images.length < 10 && <p className="mt-2 text-[11px] text-[#8a5a00]">Add {10 - form.images.length} more photo{10 - form.images.length === 1 ? '' : 's'} for a stronger listing gallery. Publishing is allowed once the minimum is met.</p>}
          {!form.images.length && <div className="mt-3 border border-dashed border-[#c9c9cc] p-8 text-center text-xs text-[#777]"><ImagePlus className="mx-auto mb-2" size={22} />No photos uploaded yet</div>}
        </div>
        <label className="grid gap-1 md:col-span-2 text-[12px] font-semibold text-[#173f35]"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal"><option value="DRAFT">Draft</option><option value="LIVE">Live</option><option value="PAUSED">Paused</option><option value="PENDING_REVIEW">Pending review</option></select></label>
      </div>
    </form>
  );
}
