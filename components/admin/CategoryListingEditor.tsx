'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, Bath, BedDouble, BedSingle, Bold, CircleParking, Code2, ConciergeBell, Flower2, GripVertical, ImagePlus, Info, Italic, Languages, Link as LinkIcon, List, ListOrdered, Monitor, Plus, Quote, Save, Search, Trash2, Upload, UserRound, Wifi, type LucideIcon } from 'lucide-react';
import type { AdminFaqRow, ListingForm } from './ContentManager';
import { stayFacilityGroups } from '@/lib/stay-facilities';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import { GenericArticle, GenericDiv, GenericSpan } from './BlogEditorExtensions';
import { ResizableImage } from './ResizableImage';
import { isFullBlogDocument, normalizeBlogHtml, splitFullBlogDocument, type FullBlogDocumentParts } from '@/lib/sanitize-html';

const categoryNames = { STAY: 'Stay', RIDE: 'Ride', RENTAL: 'Rental', ACTIVITY: 'Activity' } as const;
const valueOf = (details: Record<string, string>, name: string) => details[name] || '';
const facilityIcons = { 'Great for your stay': UserRound, Bathroom: Bath, Bedroom: BedDouble, Outdoors: Flower2, 'Room amenities': BedSingle, 'Media & Technology': Monitor, Internet: Wifi, Parking: CircleParking, Services: ConciergeBell, General: Info, 'Languages spoken': Languages };

type DetailFieldProps = { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string };

function DetailInput({ label, value, onChange, type = 'text', placeholder = '' }: DetailFieldProps) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-[#d6d9d1] bg-white px-3 font-normal outline-none focus:border-[#24584a]" />
    </label>
  );
}

function DetailTextarea({ label, value, onChange, placeholder = '' }: DetailFieldProps) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-24 rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal outline-none focus:border-[#24584a]" />
    </label>
  );
}

function FaqRow({ faq, index, total, onChange, onMove, onRemove }: { faq: AdminFaqRow; index: number; total: number; onChange: (next: AdminFaqRow) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[#e1e4dc] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[.08em] text-[#7d847c]">FAQ {index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" title="Move FAQ up" aria-label="Move FAQ up" disabled={index === 0} onClick={() => onMove(-1)} className="p-1 text-[#24584a] disabled:opacity-30"><ArrowUp size={14} /></button>
          <button type="button" title="Move FAQ down" aria-label="Move FAQ down" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 text-[#24584a] disabled:opacity-30"><ArrowDown size={14} /></button>
          <button type="button" title="Remove FAQ" aria-label="Remove FAQ" onClick={onRemove} className="p-1 text-[#a44a4a]"><Trash2 size={14} /></button>
        </div>
      </div>
      <DetailInput label="Question" value={faq.question} onChange={(value) => onChange({ ...faq, question: value })} placeholder="What are the check-in times?" />
      <DetailTextarea label="Answer" value={faq.answer} onChange={(value) => onChange({ ...faq, answer: value })} placeholder="Check-in is from 12 PM..." />
    </div>
  );
}

type Props = {
  category: keyof typeof categoryNames;
  form: ListingForm;
  setForm: Dispatch<SetStateAction<ListingForm>>;
  busy: boolean;
  message: string;
  cancel: () => void;
  save: (event: React.FormEvent) => void;
  editingId?: string | null;
};

export function CategoryListingEditor({ category, form, setForm, busy, message, cancel, save, editingId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const setDetail = (name: string, value: string) => setForm((current) => ({ ...current, details: { ...current.details, [name]: value } }));
  const documentMode = isFullBlogDocument(form.description);
  const [source, setSource] = useState(false);
  const [fullDocumentParts, setFullDocumentParts] = useState<FullBlogDocumentParts | null>(() => documentMode ? splitFullBlogDocument(form.description) : null);
  const [fullBodyChanged, setFullBodyChanged] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), GenericArticle, GenericDiv, GenericSpan, ResizableImage, TiptapLink.configure({ openOnClick: false }), Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, Youtube.configure({ controls: true, nocookie: true })],
    content: documentMode ? fullDocumentParts?.body || '<p></p>' : normalizeBlogHtml(form.description || '<p></p>'),
    onUpdate: ({ editor: current }) => { if (!source) setForm((currentForm) => ({ ...currentForm, description: documentMode && fullDocumentParts ? `${fullDocumentParts.prefix}${current.getHTML()}${fullDocumentParts.suffix}` : current.getHTML() })); if (!source && documentMode) setFullBodyChanged(true); },
    editorProps: { attributes: { class: 'prose min-h-[220px] max-w-none p-4 outline-none' } },
  });
  useEffect(() => {
    if (!source && editor && !documentMode) {
      const content = normalizeBlogHtml(form.description || '<p></p>');
      if (editor.getHTML() !== content) editor.commands.setContent(content, { emitUpdate: false });
      if (content !== form.description) setForm((current) => ({ ...current, description: content }));
    }
  }, [documentMode, editor, form.description, source, setForm]);
  useEffect(() => { if (!source && editor && documentMode && !fullBodyChanged && fullDocumentParts && editor.getHTML() !== fullDocumentParts.body) editor.commands.setContent(fullDocumentParts.body, { emitUpdate: false }); }, [documentMode, editor, fullDocumentParts, fullBodyChanged, source]);
  const toggleSource = () => {
    if (source) {
      if (isFullBlogDocument(form.description)) {
        const parts = splitFullBlogDocument(form.description);
        setFullDocumentParts(parts); setFullBodyChanged(false); editor?.commands.setContent(parts.body, { emitUpdate: false });
      } else if (editor) {
        const content = normalizeBlogHtml(form.description || '<p></p>'); editor.commands.setContent(content, { emitUpdate: false }); setForm((current) => ({ ...current, description: content }));
      }
    } else if (editor) {
      const content = documentMode && fullDocumentParts ? (fullBodyChanged ? editor.getHTML() : fullDocumentParts.body) : editor.getHTML();
      setForm((current) => ({ ...current, description: documentMode && fullDocumentParts ? `${fullDocumentParts.prefix}${content}${fullDocumentParts.suffix}` : content }));
    }
    setSource((current) => !current);
  };
  const insertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/media', { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (response.ok && typeof result.asset?.url === 'string') { const pos = editor.state.selection.from; editor.chain().focus().insertContentAt(pos, { type: 'image', attrs: { src: result.asset.url } }).run(); }
    };
    input.click();
  };
  const tools: [LucideIcon, string, string, () => void][] = [
    [Bold, 'Bold', 'bold', () => editor?.chain().focus().toggleBold().run()],
    [Italic, 'Italic', 'italic', () => editor?.chain().focus().toggleItalic().run()],
    [List, 'Bulleted list', 'bulletList', () => editor?.chain().focus().toggleBulletList().run()],
    [ListOrdered, 'Numbered list', 'orderedList', () => editor?.chain().focus().toggleOrderedList().run()],
    [Quote, 'Quote', 'blockquote', () => editor?.chain().focus().toggleBlockquote().run()],
    [LinkIcon, 'Link', 'link', () => { const url = window.prompt('Link URL'); if (url) editor?.chain().focus().setLink({ href: url }).run(); }],
    [Bold, 'Insert table', 'table', () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
    [Italic, 'Embed video', 'video', () => { const url = window.prompt('YouTube or Vimeo URL'); if (url) editor?.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run(); }],
  ];
  const editorStyles = (fullDocumentParts?.styles || '').replace(/\b(?:html|body)\b/gi, '.full-stay-editor');

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

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('unsupported protocol');
    } catch {
      setUploadMessage('Enter a valid image URL starting with http:// or https://.');
      return;
    }
    if (form.images.includes(url)) {
      setUploadMessage('That image URL has already been added.');
      return;
    }
    setForm((current) => ({ ...current, images: [...current.images, url] }));
    setImageUrl('');
    setUploadMessage('');
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

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7 [&_b]:hidden">
      {message && <p className="mb-5 border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-[#616161]"><button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Back</button><span>/ {categoryNames[category]} editor</span></div>
        <button disabled={busy} className="inline-flex items-center gap-2 bg-[#173f35] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"><Save size={14} /> Save</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Title</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Location</span><input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Slug</span><input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="listing-slug" className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Base price<b className="ml-1 text-[#a44a4a">*</b></span><input type="number" min="0" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]"><span>Selling price<b className="ml-1 text-[#a44a4a">*</b></span><input type="number" min="0" value={form.sellPrice} onChange={(event) => setForm((current) => ({ ...current, sellPrice: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal" /></label>
        {category === 'STAY' && <><DetailInput label="Property type" value={valueOf(form.details, 'propertyType')} onChange={(value) => setDetail('propertyType', value)} placeholder="Homestay, hotel, villa" /><DetailInput label="Room arrangement" value={valueOf(form.details, 'roomArrangement')} onChange={(value) => setDetail('roomArrangement', value)} placeholder="Entire place or private room" /><DetailInput label="Full address" value={valueOf(form.details, 'fullAddress')} onChange={(value) => setDetail('fullAddress', value)} /><DetailInput label="Map pin" value={valueOf(form.details, 'mapPin')} onChange={(value) => setDetail('mapPin', value)} placeholder="Google Maps URL or coordinates" /><DetailInput label="Maximum guests" value={valueOf(form.details, 'maxGuests')} onChange={(value) => setDetail('maxGuests', value)} type="number" /><DetailInput label="Bedrooms" value={valueOf(form.details, 'bedrooms')} onChange={(value) => setDetail('bedrooms', value)} type="number" /><DetailInput label="Beds" value={valueOf(form.details, 'beds')} onChange={(value) => setDetail('beds', value)} type="number" /><DetailInput label="Bathrooms" value={valueOf(form.details, 'bathrooms')} onChange={(value) => setDetail('bathrooms', value)} type="number" /><DetailInput label="Check-in time" value={valueOf(form.details, 'checkIn')} onChange={(value) => setDetail('checkIn', value)} type="time" /><DetailInput label="Check-out time" value={valueOf(form.details, 'checkOut')} onChange={(value) => setDetail('checkOut', value)} type="time" /><DetailInput label="Cancellation policy" value={valueOf(form.details, 'cancellationPolicy')} onChange={(value) => setDetail('cancellationPolicy', value)} placeholder="Flexible, moderate, or strict" /><DetailInput label="Amenities" value={valueOf(form.details, 'amenities')} onChange={(value) => setDetail('amenities', value)} placeholder="Wi-Fi, parking, breakfast" /><DetailInput label="Audience tags" value={valueOf(form.details, 'audienceTags')} onChange={(value) => setDetail('audienceTags', value)} placeholder="Families, groups, pets" /><DetailTextarea label="House rules" value={valueOf(form.details, 'houseRules')} onChange={(value) => setDetail('houseRules', value)} /><DetailTextarea label="Neighborhood" value={valueOf(form.details, 'neighborhood')} onChange={(value) => setDetail('neighborhood', value)} /></>}
        {category === 'RIDE' && <><DetailInput label="Vehicle type" value={valueOf(form.details, 'vehicleType')} onChange={(value) => setDetail('vehicleType', value)} /><DetailInput label="Passenger capacity" value={valueOf(form.details, 'passengerCapacity')} onChange={(value) => setDetail('passengerCapacity', value)} type="number" /><DetailInput label="Route or custom pickup" value={valueOf(form.details, 'route')} onChange={(value) => setDetail('route', value)} /><DetailInput label="Estimated duration" value={valueOf(form.details, 'duration')} onChange={(value) => setDetail('duration', value)} /><DetailTextarea label="Driver notes" value={valueOf(form.details, 'driverNotes')} onChange={(value) => setDetail('driverNotes', value)} /><DetailTextarea label="Waiting, toll, and fuel notes" value={valueOf(form.details, 'pricingNotes')} onChange={(value) => setDetail('pricingNotes', value)} /></>}
        {category === 'RENTAL' && <><DetailInput label="Vehicle type" value={valueOf(form.details, 'vehicleType')} onChange={(value) => setDetail('vehicleType', value)} placeholder="Bike or scooty" /><DetailInput label="Make / model" value={valueOf(form.details, 'makeModel')} onChange={(value) => setDetail('makeModel', value)} /><DetailInput label="Year" value={valueOf(form.details, 'year')} onChange={(value) => setDetail('year', value)} type="number" /><DetailInput label="Registration / license plate" value={valueOf(form.details, 'registrationNumber')} onChange={(value) => setDetail('registrationNumber', value)} /><DetailInput label="Transmission" value={valueOf(form.details, 'transmission')} onChange={(value) => setDetail('transmission', value)} /><DetailInput label="Daily price" value={valueOf(form.details, 'dailyPrice')} onChange={(value) => setDetail('dailyPrice', value)} type="number" /><DetailInput label="Quantity available" value={valueOf(form.details, 'quantity')} onChange={(value) => setDetail('quantity', value)} type="number" /><DetailInput label="Mileage / odometer" value={valueOf(form.details, 'mileage')} onChange={(value) => setDetail('mileage', value)} /><DetailInput label="Fuel type" value={valueOf(form.details, 'fuelType')} onChange={(value) => setDetail('fuelType', value)} /><DetailInput label="Capacity" value={valueOf(form.details, 'capacity')} onChange={(value) => setDetail('capacity', value)} /><DetailInput label="Pickup / delivery options" value={valueOf(form.details, 'pickupOptions')} onChange={(value) => setDetail('pickupOptions', value)} /><DetailTextarea label="Notable features" value={valueOf(form.details, 'features')} onChange={(value) => setDetail('features', value)} placeholder="Helmet included, phone mount" /><DetailTextarea label="FAQ" value={valueOf(form.details, 'faq')} onChange={(value) => setDetail('faq', value)} placeholder="Question and answer pairs" /></>}
        {category === 'ACTIVITY' && <><DetailInput label="Minimum group size" value={valueOf(form.details, 'groupMin')} onChange={(value) => setDetail('groupMin', value)} type="number" /><DetailInput label="Maximum group size" value={valueOf(form.details, 'groupMax')} onChange={(value) => setDetail('groupMax', value)} type="number" /><DetailTextarea label="What is included" value={valueOf(form.details, 'included')} onChange={(value) => setDetail('included', value)} /><DetailTextarea label="Safety information" value={valueOf(form.details, 'safetyInformation')} onChange={(value) => setDetail('safetyInformation', value)} /><DetailTextarea label="About the guide/operator" value={valueOf(form.details, 'guideAbout')} onChange={(value) => setDetail('guideAbout', value)} /><DetailInput label="Duration" value={valueOf(form.details, 'duration')} onChange={(value) => setDetail('duration', value)} /><DetailInput label="Meeting point" value={valueOf(form.details, 'meetingPoint')} onChange={(value) => setDetail('meetingPoint', value)} /></>}
        {category === 'STAY' && <div className="md:col-span-2 rounded-2xl border border-[#dfe3d8] bg-[#f7f8f4] p-4"><div><p className="text-[13px] font-bold text-[#173f35]">Stay facilities</p><p className="mt-1 text-[11px] font-normal text-[#6c7770]">Choose the facilities guests can expect. New stays start with all facilities selected.</p></div><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{stayFacilityGroups.map((group) => { const Icon = facilityIcons[group.title as keyof typeof facilityIcons] || Info; return <fieldset key={group.title} className="rounded-xl border border-[#e1e4dc] bg-white p-3"><legend className="px-1 text-[12px] font-bold text-[#173f35]"><span className="inline-flex items-center gap-2"><Icon size={16} strokeWidth={1.8} />{group.title}</span></legend><div className="grid gap-2">{group.items.map((item) => <label key={`${group.title}-${item.key}`} className="flex items-start gap-2 text-[12px] font-normal text-[#526057]"><input type="checkbox" checked={form.stayFacilities[item.key] ?? true} onChange={(event) => setForm((current) => ({ ...current, stayFacilities: { ...current.stayFacilities, [item.key]: event.target.checked } }))} className="mt-0.5 accent-[#24584a]" /><span>{item.label}</span></label>)}</div></fieldset>; })}</div></div>}
        {category === 'STAY' && <div className="md:col-span-2 rounded-2xl border border-[#dfe3d8] bg-[#f7f8f4] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[13px] font-bold text-[#173f35]">Frequently Asked Questions</p><p className="mt-1 text-[11px] font-normal text-[#6c7770]">Shown on the public stay page under “Travelers are asking”. Saved together with this stay.</p></div><span className="rounded-full bg-[#eef4ef] px-2 py-1 text-[11px] font-bold text-[#24584a]">{form.faqs.length} added</span></div>{form.faqs.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No FAQs yet — add one below</p>}<div className="mt-3 grid gap-3">{form.faqs.map((faq, index) => <FaqRow key={faq.id ?? `new-${index}`} faq={faq} index={index} total={form.faqs.length} onChange={(next) => setForm((current) => ({ ...current, faqs: current.faqs.map((row, rowIndex) => (rowIndex === index ? next : row)) }))} onMove={(direction) => setForm((current) => { const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= current.faqs.length) return current; const next = [...current.faqs]; const temp = next[index]; next[index] = next[nextIndex]; next[nextIndex] = temp; return { ...current, faqs: next }; })} onRemove={() => setForm((current) => ({ ...current, faqs: current.faqs.filter((_, rowIndex) => rowIndex !== index) }))} />)}</div><button type="button" onClick={() => setForm((current) => ({ ...current, faqs: [...current.faqs, { question: '', answer: '' }] }))} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add FAQ</button>{!editingId && form.faqs.length > 0 && <p className="mt-2 text-[11px] text-[#6c7770]">FAQs are saved when you save this new stay.</p>}</div>}
        <div className="grid gap-2 md:col-span-2">
          <label className="text-[12px] font-semibold text-[#173f35]">Description{category !== 'RENTAL' && <b className="ml-1 text-[#a44a4a]">*</b>}</label>
          <div className="rounded-2xl border border-[#d9d9dc] bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#e1e1e3] bg-[#fafafa] p-2">
              {tools.map(([Icon, label, mark, onClick]) => <button type="button" key={label} title={label} aria-label={label} aria-pressed={Boolean(editor?.isActive(mark))} onClick={onClick} className="grid h-8 w-8 place-items-center hover:bg-[#e9e9eb]"><Icon size={15} /></button>)}
              <button type="button" title="Heading 2" aria-label="Heading 2" aria-pressed={Boolean(editor?.isActive('heading'))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="h-8 w-8 text-xs font-bold hover:bg-[#e9e9eb]">H2</button>
              <button type="button" title="Insert image" aria-label="Insert image" onClick={insertImage} className="grid h-8 w-8 place-items-center hover:bg-[#e9e9eb]"><ImagePlus size={15} /></button>
              <button type="button" title="HTML source" aria-label="HTML source" aria-pressed={source} onClick={toggleSource} className={`grid h-8 w-8 place-items-center text-xs font-bold ${source ? 'bg-[#dcefe2] text-[#24584a]' : 'hover:bg-[#e9e9eb]'}`}><Code2 size={15} /></button>
            </div>
            {source ? <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[220px] w-full p-4 font-mono text-[12px] outline-none" /> : <div className={documentMode ? 'full-stay-editor' : undefined}>{documentMode && editorStyles && <style dangerouslySetInnerHTML={{ __html: editorStyles }} />}<EditorContent editor={editor} /></div>}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[12px] font-semibold text-[#173f35]">Photos <span className="font-normal text-[#6c7770]">{category === 'STAY' || category === 'ACTIVITY' ? 'minimum 5 to publish' : category === 'RENTAL' ? 'minimum 3 to publish' : 'minimum 2 to publish'}</span></p><p className="mt-1 text-[11px] text-[#6c7770]">Use clear photos of the actual listing. Avoid text overlays.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#173f35] px-3 py-2 text-xs font-bold text-white"><Upload size={14} /> {uploading ? 'Uploading...' : 'Upload photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={upload} className="hidden" /></label></div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d6d9d1] bg-white px-3 focus-within:border-[#24584a]"><LinkIcon size={14} className="shrink-0 text-[#6c7770]" /><input type="url" value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); if (uploadMessage) setUploadMessage(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl(); } }} placeholder="Paste an image URL" className="h-10 min-w-0 flex-1 outline-none" /></label><button type="button" onClick={addImageUrl} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#173f35] px-4 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]">Add URL</button></div>
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
