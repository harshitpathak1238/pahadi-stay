'use client';

import { useEffect, useState, type ChangeEvent, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Bath, BedDouble, BedSingle, Bold, CircleParking, Code2, ConciergeBell, Flower2, GripVertical, ImagePlus, Info, Italic, Languages, Link as LinkIcon, List, ListOrdered, Monitor, Plus, Quote, Save, Star, Table2, Trash2, Upload, UserRound, Video, Wifi, type LucideIcon } from 'lucide-react';
import type { AccommodationRow, AdminFaqRow, HouseRuleRow, ListingForm } from './ContentManager';
import { DefaultHouseRules } from '@/lib/listings';
import { stayFacilityGroups } from '@/lib/stay-facilities';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { Table as TiptapTable } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import { GenericArticle, GenericDiv, GenericSpan } from './BlogEditorExtensions';
import { ResizableImage } from './ResizableImage';
import { StayReviewsModal } from './StayReviewsModal';
import { isFullBlogDocument, normalizeBlogHtml, splitFullBlogDocument, type FullBlogDocumentParts } from '@/lib/sanitize-html';

const categoryNames = { STAY: 'Stay', RIDE: 'Ride', RENTAL: 'Rental', ACTIVITY: 'Activity' } as const;
const stayTabs = [
  { key: 'location', label: 'Location & Overview' },
  { key: 'accommodations', label: 'Accommodations' },
  { key: 'food', label: 'Food & Experiences' },
  { key: 'pricing', label: 'Pricing & Bookings' },
] as const;
const mealPlanOptions = ['Breakfast included', 'Half board', 'Full board', 'Self-catering / no meals'] as const;
const facilityIcons = { 'Great for your stay': UserRound, Bathroom: Bath, Bedroom: BedDouble, Outdoors: Flower2, 'Room amenities': BedSingle, 'Media & Technology': Monitor, Internet: Wifi, Parking: CircleParking, Services: ConciergeBell, General: Info, 'Languages spoken': Languages };
const valueOf = (details: Record<string, string>, name: string) => details[name] || '';

const reorder = <T,>(items: T[], index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

type StayTab = (typeof stayTabs)[number]['key'];
type DetailFieldProps = { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; className?: string };
type Props = {
  category: keyof typeof categoryNames;
  form: ListingForm;
  setForm: Dispatch<SetStateAction<ListingForm>>;
  busy: boolean;
  message: string;
  cancel: () => void;
  save: (event: FormEvent) => void;
  editingId?: string | null;
};

function DetailInput({ label, value, onChange, type = 'text', placeholder = '', className = '' }: DetailFieldProps) {
  return (
    <label className={`grid gap-1 text-[12px] font-semibold text-[#173f35] ${className}`}>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-xl border border-[#d6d9d1] bg-white px-3 font-normal outline-none focus:border-[#24584a]" />
    </label>
  );
}

function DetailTextarea({ label, value, onChange, placeholder = '', className = '' }: DetailFieldProps) {
  return (
    <label className={`grid gap-1 text-[12px] font-semibold text-[#173f35] ${className}`}>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-24 rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal outline-none focus:border-[#24584a]" />
    </label>
  );
}

function SectionPanel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#dfe3d8] bg-[#f7f8f4] p-4 md:col-span-2">
      <div>
        <p className="text-[13px] font-bold text-[#173f35]">{title}</p>
        {note && <p className="mt-1 text-[11px] font-normal text-[#6c7770]">{note}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RepeatableRow({ label, index, total, children, onMove, onRemove }: { label: string; index: number; total: number; children: ReactNode; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[#e1e4dc] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[.08em] text-[#7d847c]">{label} {index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" title={`Move ${label} up`} aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)} className="p-1 text-[#24584a] disabled:opacity-30"><ArrowUp size={14} /></button>
          <button type="button" title={`Move ${label} down`} aria-label={`Move ${label} down`} disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 text-[#24584a] disabled:opacity-30"><ArrowDown size={14} /></button>
          <button type="button" title={`Remove ${label}`} aria-label={`Remove ${label}`} onClick={onRemove} className="p-1 text-[#a44a4a]"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function FaqRow({ faq, index, total, onChange, onMove, onRemove }: { faq: AdminFaqRow; index: number; total: number; onChange: (next: AdminFaqRow) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  return (
    <RepeatableRow label="FAQ" index={index} total={total} onMove={onMove} onRemove={onRemove}>
      <DetailInput label="Question" value={faq.question} onChange={(value) => onChange({ ...faq, question: value })} placeholder="What are the check-in times?" />
      <DetailTextarea label="Answer" value={faq.answer} onChange={(value) => onChange({ ...faq, answer: value })} placeholder="Check-in is from 12 PM..." />
    </RepeatableRow>
  );
}

function HouseRulesRow({ rule, index, total, onChange, onMove, onRemove }: { rule: HouseRuleRow; index: number; total: number; onChange: (next: HouseRuleRow) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  return (
    <RepeatableRow label="Rule" index={index} total={total} onMove={onMove} onRemove={onRemove}>
      <DetailInput label="Title" value={rule.title} onChange={(value) => onChange({ ...rule, title: value })} placeholder="Quiet hours" />
      <DetailTextarea label="Description" value={rule.text} onChange={(value) => onChange({ ...rule, text: value })} placeholder="Quiet hours between 22:00 and 07:00." />
    </RepeatableRow>
  );
}

function AccommodationItem({ accommodation, index, total, onChange, onMove, onRemove, onUploadImage }: { accommodation: AccommodationRow; index: number; total: number; onChange: (next: AccommodationRow) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void; onUploadImage: () => void }) {
  const [imageUrl, setImageUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('unsupported protocol');
    } catch {
      setUrlError('Enter a valid image URL starting with http:// or https://.');
      return;
    }
    setUrlError('');
    setImageUrl('');
    if (!accommodation.image) onChange({ ...accommodation, image: url });
    else onChange({ ...accommodation, images: [...(accommodation.images || []), url] });
  };

  const removeExtraImage = (target: number) => onChange({ ...accommodation, images: (accommodation.images || []).filter((_, i) => i !== target) });
  const makeCover = (target: number) => onChange({ ...accommodation, image: (accommodation.images || [])[target] || accommodation.image, images: [accommodation.image, ...(accommodation.images || [])].filter(Boolean).filter((url, i, all) => all.indexOf(url) === i).slice(1) });

  return (
    <RepeatableRow label="Accommodation" index={index} total={total} onMove={onMove} onRemove={onRemove}>
      <DetailInput label="Title" value={accommodation.title} onChange={(value) => onChange({ ...accommodation, title: value })} placeholder="Deluxe King Bedroom" />
      <DetailTextarea label="Description" value={accommodation.description} onChange={(value) => onChange({ ...accommodation, description: value })} placeholder="Spacious room with a king-size bed..." />
      <div className="grid gap-1 text-[12px] font-semibold text-[#173f35] md:col-span-2">
        <span>Photos <span className="font-normal text-[#6c7770]">(the first photo is the cover shown on the card; visitors can swipe through all of them)</span></span>
        <div className="flex flex-wrap items-start gap-2 sm:gap-3">
          {accommodation.image && (
            <span className="relative inline-block">
              <img src={accommodation.image} alt={accommodation.title || 'Accommodation'} className="h-16 w-16 rounded-lg object-cover" />
              <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-[#173f35]/80 py-px text-center text-[9px] font-bold uppercase tracking-wide text-white">Cover</span>
              <button type="button" title="Remove cover photo" aria-label="Remove cover photo" onClick={() => onChange({ ...accommodation, image: (accommodation.images || [])[0] || '', images: (accommodation.images || []).slice(1) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#a44a4a] text-white"><Trash2 size={11} /></button>
            </span>
          )}
          {(accommodation.images || []).map((url, i) => (
            <span key={`${url}-${i}`} className="relative inline-block">
              <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <button type="button" title="Remove photo" aria-label="Remove photo" onClick={() => removeExtraImage(i)} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#a44a4a] text-white"><Trash2 size={11} /></button>
              {accommodation.image && <button type="button" title="Make cover photo" aria-label="Make cover photo" onClick={() => makeCover(i)} className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/55 py-0.5 text-[9px] font-bold text-white">Set cover</button>}
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={onUploadImage} className="inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Upload size={14} /> Upload photos</button>
          <span className="text-[11px] font-normal text-[#6c7770]">or</span>
          <span className="flex items-center gap-1.5">
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => { setImageUrl(event.target.value); setUrlError(''); }}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl(); } }}
              placeholder="Paste image URL"
              className="h-9 w-52 rounded-lg border border-[#d6d9d1] bg-white px-2.5 text-[12px] font-normal outline-none focus:border-[#24584a]"
            />
            <button type="button" onClick={addImageUrl} className="inline-flex items-center gap-1.5 rounded-lg border border-[#173f35] px-3 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><LinkIcon size={13} /> Add</button>
          </span>
        </div>
        {urlError && <span className="mt-1 text-[11px] font-normal text-[#a44a4a]">{urlError}</span>}
      </div>
      <DetailInput label="Price per night (₹)" type="number" value={accommodation.price} onChange={(value) => onChange({ ...accommodation, price: value })} placeholder="2500" />
      <DetailInput label="Bedrooms" type="number" value={accommodation.bedrooms} onChange={(value) => onChange({ ...accommodation, bedrooms: value })} />
      <DetailInput label="Beds" type="number" value={accommodation.beds} onChange={(value) => onChange({ ...accommodation, beds: value })} />
    </RepeatableRow>
  );
}

function AccommodationsEditor({ form, setForm, uploadAccommodationImage }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>>; uploadAccommodationImage: (index: number) => void }) {
  const accommodations = form.accommodations || [];
  return (
    <SectionPanel title="Accommodations" note="Add detailed bedroom/accommodation entries with images. These appear in the accommodations gallery on the public stay page.">
      {accommodations.length === 0 && <p className="rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No accommodations added yet.</p>}
            <div className="grid gap-3">{accommodations.map((acc, index) => <AccommodationItem key={acc.id ?? `new-${index}`} accommodation={acc} index={index} total={accommodations.length} onChange={(next) => setForm((current) => ({ ...current, accommodations: current.accommodations.map((item, i) => i === index ? next : item) }))} onMove={(direction) => setForm((current) => ({ ...current, accommodations: reorder(current.accommodations, index, direction) }))} onRemove={() => setForm((current) => ({ ...current, accommodations: current.accommodations.filter((_, i) => i !== index) }))} onUploadImage={() => uploadAccommodationImage(index)} />)}</div>
      <div className="mt-3 flex gap-2"><button type="button" onClick={() => setForm((current) => ({ ...current, accommodations: [...(current.accommodations || []), { title: '', description: '', image: '', images: [], price: '', bedrooms: '', beds: '' }] }))} className="inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add accommodation</button></div>
    </SectionPanel>
  );
}

export function CategoryListingEditor({ category, form, setForm, busy, message, cancel, save, editingId }: Props) {
  const [activeStayTab, setActiveStayTab] = useState<StayTab>('location');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [source, setSource] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const documentMode = isFullBlogDocument(form.description);
  const [fullDocumentParts, setFullDocumentParts] = useState<FullBlogDocumentParts | null>(() => documentMode ? splitFullBlogDocument(form.description) : null);
  const [fullBodyChanged, setFullBodyChanged] = useState(false);
  const setDetail = (name: string, value: string) => setForm((current) => ({ ...current, details: { ...current.details, [name]: value } }));

  useEffect(() => {
    if (category !== 'STAY' || !editingId) return;
    let active = true;
    fetch(`/api/admin/reviews?listingId=${encodeURIComponent(editingId)}`, { cache: 'no-store' }).then(async (response) => {
      if (!active || !response.ok) return;
      const data = await response.json();
      if (active && Array.isArray(data.reviews)) setReviewCount(data.reviews.length as number);
    }).catch(() => {});
    return () => { active = false; };
  }, [category, editingId, reviewsOpen]);

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), GenericArticle, GenericDiv, GenericSpan, ResizableImage, TiptapLink.configure({ openOnClick: false }), TiptapTable.configure({ resizable: true }), TableRow, TableHeader, TableCell, Youtube.configure({ controls: true, nocookie: true })],
    content: documentMode ? fullDocumentParts?.body || '<p></p>' : normalizeBlogHtml(form.description || '<p></p>'),
    onUpdate: ({ editor: current }) => {
      if (!source) setForm((currentForm) => ({ ...currentForm, description: documentMode && fullDocumentParts ? `${fullDocumentParts.prefix}${current.getHTML()}${fullDocumentParts.suffix}` : current.getHTML() }));
      if (!source && documentMode) setFullBodyChanged(true);
    },
    editorProps: { attributes: { class: 'prose min-h-[220px] max-w-none p-4 outline-none' } },
  });

  useEffect(() => {
    if (!source && editor && !documentMode) {
      const content = normalizeBlogHtml(form.description || '<p></p>');
      if (editor.getHTML() !== content) editor.commands.setContent(content, { emitUpdate: false });
      if (content !== form.description) setForm((current) => ({ ...current, description: content }));
    }
  }, [documentMode, editor, form.description, source, setForm]);

  useEffect(() => {
    if (!source && editor && documentMode && !fullBodyChanged && fullDocumentParts && editor.getHTML() !== fullDocumentParts.body) editor.commands.setContent(fullDocumentParts.body, { emitUpdate: false });
  }, [documentMode, editor, fullDocumentParts, fullBodyChanged, source]);

  const toggleSource = () => {
    if (source) {
      if (isFullBlogDocument(form.description)) {
        const parts = splitFullBlogDocument(form.description);
        setFullDocumentParts(parts);
        setFullBodyChanged(false);
        editor?.commands.setContent(parts.body, { emitUpdate: false });
      } else if (editor) {
        const content = normalizeBlogHtml(form.description || '<p></p>');
        editor.commands.setContent(content, { emitUpdate: false });
        setForm((current) => ({ ...current, description: content }));
      }
    } else if (editor) {
      const content = documentMode && fullDocumentParts ? (fullBodyChanged ? editor.getHTML() : fullDocumentParts.body) : editor.getHTML();
      setForm((current) => ({ ...current, description: documentMode && fullDocumentParts ? `${fullDocumentParts.prefix}${content}${fullDocumentParts.suffix}` : content }));
    }
    setSource((current) => !current);
  };

  const tools: [LucideIcon, string, string, () => void][] = [
    [Bold, 'Bold', 'bold', () => editor?.chain().focus().toggleBold().run()],
    [Italic, 'Italic', 'italic', () => editor?.chain().focus().toggleItalic().run()],
    [List, 'Bulleted list', 'bulletList', () => editor?.chain().focus().toggleBulletList().run()],
    [ListOrdered, 'Numbered list', 'orderedList', () => editor?.chain().focus().toggleOrderedList().run()],
    [Quote, 'Quote', 'blockquote', () => editor?.chain().focus().toggleBlockquote().run()],
    [LinkIcon, 'Link', 'link', () => { const url = window.prompt('Link URL'); if (url) editor?.chain().focus().setLink({ href: url }).run(); }],
    [Table2, 'Insert table', 'table', () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
    [Video, 'Embed video', 'video', () => { const url = window.prompt('YouTube or Vimeo URL'); if (url) editor?.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run(); }],
  ];

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
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
      if (response.ok && typeof result.asset?.url === 'string') editor.chain().focus().insertContent({ type: 'image', attrs: { src: result.asset.url } }).run();
    };
    input.click();
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
    const resetHouseRules = () => setForm((current) => ({ ...current, houseRules: [...DefaultHouseRules] }));
  const clearHouseRules = () => {
    if (window.confirm('Remove all house rules? This can be undone by resetting to template.')) setForm((current) => ({ ...current, houseRules: [] }));
  };

  const uploadAccommodationImage = async (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      const uploaded: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/admin/media', { method: 'POST', body });
        const result = await response.json().catch(() => ({}));
        if (response.ok && typeof result.asset?.url === 'string') uploaded.push(result.asset.url);
      }
      if (!uploaded.length) return;
      setForm((current) => ({ ...current, accommodations: current.accommodations.map((item, i) => i === index ? { ...item, image: item.image || uploaded[0], images: item.image ? [...(item.images || []), ...uploaded] : uploaded.slice(1) } : item) }));
    };
    input.click();
  };

  const editorStyles = (fullDocumentParts?.styles || '').replace(/\b(?:html|body)\b/gi, '.full-stay-editor');
  const showShared = category !== 'STAY' || activeStayTab === 'location';

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7 [&_b]:hidden">
      {message && <p className="mb-5 border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-[#616161]">
          <button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Back</button>
          <span>/ {categoryNames[category]} editor</span>
        </div>
        <button disabled={busy} className="inline-flex items-center gap-2 bg-[#173f35] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"><Save size={14} /> Save</button>
      </div>

      {category === 'STAY' && (
        <div className="mb-5 flex gap-2 overflow-x-auto border-b border-[#e4e7df] pb-2">
          {stayTabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveStayTab(tab.key)} className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition ${activeStayTab === tab.key ? 'bg-[#173f35] text-white' : 'bg-[#eef4ef] text-[#24584a] hover:bg-[#dcefe2]'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {showShared && (
          <>
            <DetailInput label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
            <DetailInput label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
            <DetailInput label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} placeholder="listing-slug" />
          </>
        )}

        {category !== 'STAY' && (
          <>
            <DetailInput label="Base price" type="number" value={form.basePrice} onChange={(value) => setForm((current) => ({ ...current, basePrice: value }))} />
            <DetailInput label="Selling price" type="number" value={form.sellPrice} onChange={(value) => setForm((current) => ({ ...current, sellPrice: value }))} />
          </>
        )}

        {category === 'STAY' && activeStayTab === 'location' && (
          <>
            <DetailInput label="Property type" value={valueOf(form.details, 'propertyType')} onChange={(value) => setDetail('propertyType', value)} placeholder="Homestay, hotel, villa" />
            <DetailInput label="Full address" value={valueOf(form.details, 'fullAddress')} onChange={(value) => setDetail('fullAddress', value)} />
            <DetailInput label="Map pin" value={valueOf(form.details, 'mapPin')} onChange={(value) => setDetail('mapPin', value)} placeholder="Google Maps URL or coordinates" className="md:col-span-2" />
            <DetailTextarea label="Neighborhood" value={valueOf(form.details, 'neighborhood')} onChange={(value) => setDetail('neighborhood', value)} className="md:col-span-2" />
            <LandmarkEditor form={form} setForm={setForm} />
            <ServiceEditor form={form} setForm={setForm} />
            <DescriptionEditor category={category} form={form} setForm={setForm} source={source} editor={editor} documentMode={documentMode} editorStyles={editorStyles} tools={tools} insertImage={insertImage} toggleSource={toggleSource} />
            <FaqEditor form={form} setForm={setForm} editingId={editingId} />
            <PhotosEditor category={category} form={form} imageUrl={imageUrl} setImageUrl={setImageUrl} uploadMessage={uploadMessage} setUploadMessage={setUploadMessage} uploading={uploading} upload={upload} addImageUrl={addImageUrl} moveImage={moveImage} setFeatured={setFeatured} removeImage={removeImage} />
          </>
        )}

        {category === 'STAY' && activeStayTab === 'accommodations' && (
          <>
            <DetailInput label="Room arrangement" value={valueOf(form.details, 'roomArrangement')} onChange={(value) => setDetail('roomArrangement', value)} placeholder="Entire place or private room" />
            <DetailInput label="Maximum guests" type="number" value={valueOf(form.details, 'maxGuests')} onChange={(value) => setDetail('maxGuests', value)} />
            <DetailInput label="Bedrooms" type="number" value={valueOf(form.details, 'bedrooms')} onChange={(value) => setDetail('bedrooms', value)} />
            <DetailInput label="Beds" type="number" value={valueOf(form.details, 'beds')} onChange={(value) => setDetail('beds', value)} />
            <DetailInput label="Bathrooms" type="number" value={valueOf(form.details, 'bathrooms')} onChange={(value) => setDetail('bathrooms', value)} />
            <DetailInput label="Amenities" value={form.amenities} onChange={(value) => setForm((current) => ({ ...current, amenities: value }))} placeholder="Wi-Fi, parking, breakfast" />
            <DetailInput label="Audience tags" value={valueOf(form.details, 'audienceTags')} onChange={(value) => setDetail('audienceTags', value)} placeholder="Families, groups, pets" className="md:col-span-2" />
                        <FacilitiesEditor form={form} setForm={setForm} />
            <AccommodationsEditor form={form} setForm={setForm} uploadAccommodationImage={uploadAccommodationImage} />
          </>
        )}

        {category === 'STAY' && activeStayTab === 'food' && (
          <>
            <label className="grid gap-1 text-[12px] font-semibold text-[#173f35]">
              <span>Meal plan</span>
              <select value={form.mealPlan} onChange={(event) => setForm((current) => ({ ...current, mealPlan: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] bg-white px-3 font-normal outline-none focus:border-[#24584a]">
                <option value="">Not specified</option>
                {mealPlanOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="flex h-10 items-center gap-2 self-end rounded-xl border border-[#d6d9d1] bg-white px-3 text-[12px] font-semibold text-[#173f35]">
              <input type="checkbox" checked={form.breakfastIncluded} onChange={(event) => setForm((current) => ({ ...current, breakfastIncluded: event.target.checked }))} className="accent-[#24584a]" />
              <span>Breakfast included</span>
            </label>
            <DetailTextarea label="Cuisine notes" value={form.cuisineNotes} onChange={(value) => setForm((current) => ({ ...current, cuisineNotes: value }))} placeholder="Home-cooked Kumaoni meals, Jain food on request, cafe nearby..." className="md:col-span-2" />
            <ExperienceEditor form={form} setForm={setForm} />
          </>
        )}

        {category === 'STAY' && activeStayTab === 'pricing' && (
          <>
            <DetailInput label="Base price" type="number" value={form.basePrice} onChange={(value) => setForm((current) => ({ ...current, basePrice: value }))} />
            <DetailInput label="Selling price" type="number" value={form.sellPrice} onChange={(value) => setForm((current) => ({ ...current, sellPrice: value }))} />
            <DetailInput label="Check-in time" type="time" value={valueOf(form.details, 'checkIn')} onChange={(value) => setDetail('checkIn', value)} />
            <DetailInput label="Check-out time" type="time" value={valueOf(form.details, 'checkOut')} onChange={(value) => setDetail('checkOut', value)} />
            <DetailInput label="Cancellation policy" value={valueOf(form.details, 'cancellationPolicy')} onChange={(value) => setDetail('cancellationPolicy', value)} placeholder="Flexible, moderate, or strict" className="md:col-span-2" />
            <HouseRulesEditor form={form} setForm={setForm} resetHouseRules={resetHouseRules} clearHouseRules={clearHouseRules} />
            <ReviewPanel editingId={editingId} title={form.title || 'This stay'} reviewCount={reviewCount} open={() => setReviewsOpen(true)} />
            <StatusField form={form} setForm={setForm} />
          </>
        )}

        {category === 'RIDE' && <RideFields form={form} setDetail={setDetail} />}
        {category === 'RENTAL' && <RentalFields form={form} setDetail={setDetail} />}
        {category === 'ACTIVITY' && <ActivityFields form={form} setDetail={setDetail} />}
        {category !== 'STAY' && (
          <>
            <DescriptionEditor category={category} form={form} setForm={setForm} source={source} editor={editor} documentMode={documentMode} editorStyles={editorStyles} tools={tools} insertImage={insertImage} toggleSource={toggleSource} />
            <PhotosEditor category={category} form={form} imageUrl={imageUrl} setImageUrl={setImageUrl} uploadMessage={uploadMessage} setUploadMessage={setUploadMessage} uploading={uploading} upload={upload} addImageUrl={addImageUrl} moveImage={moveImage} setFeatured={setFeatured} removeImage={removeImage} />
            <StatusField form={form} setForm={setForm} />
          </>
        )}
      </div>

      {reviewsOpen && editingId && <StayReviewsModal listingId={editingId} stayTitle={form.title || 'This stay'} onClose={() => setReviewsOpen(false)} />}
    </form>
  );
}

function LandmarkEditor({ form, setForm }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>> }) {
  return (
    <SectionPanel title="Prime Location" note="Add nearby landmarks with distance in kilometers. Public cards sort these by nearest first.">
      {form.landmarks.length === 0 && <p className="rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No landmarks yet.</p>}
      <div className="grid gap-3">{form.landmarks.map((landmark, index) => (
        <RepeatableRow key={landmark.id ?? `landmark-${index}`} label="Landmark" index={index} total={form.landmarks.length} onMove={(direction) => setForm((current) => ({ ...current, landmarks: reorder(current.landmarks, index, direction) }))} onRemove={() => setForm((current) => ({ ...current, landmarks: current.landmarks.filter((_, rowIndex) => rowIndex !== index) }))}>
          <DetailInput label="Label" value={landmark.label} onChange={(value) => setForm((current) => ({ ...current, landmarks: current.landmarks.map((row, rowIndex) => rowIndex === index ? { ...row, label: value } : row) }))} placeholder="Bhimtal Lake" />
          <DetailInput label="Distance (km)" type="number" value={landmark.distanceKm} onChange={(value) => setForm((current) => ({ ...current, landmarks: current.landmarks.map((row, rowIndex) => rowIndex === index ? { ...row, distanceKm: value } : row) }))} placeholder="1.2" />
        </RepeatableRow>
      ))}</div>
      <button type="button" onClick={() => setForm((current) => ({ ...current, landmarks: [...current.landmarks, { label: '', distanceKm: '' }] }))} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add landmark</button>
    </SectionPanel>
  );
}

function ServiceEditor({ form, setForm }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>> }) {
  return (
    <SectionPanel title="Convenient Services" note="Add useful nearby essentials such as ATMs, markets, pharmacies, or hospitals.">
      {form.services.length === 0 && <p className="rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No services yet.</p>}
      <div className="grid gap-3">{form.services.map((service, index) => (
        <RepeatableRow key={service.id ?? `service-${index}`} label="Service" index={index} total={form.services.length} onMove={(direction) => setForm((current) => ({ ...current, services: reorder(current.services, index, direction) }))} onRemove={() => setForm((current) => ({ ...current, services: current.services.filter((_, rowIndex) => rowIndex !== index) }))}>
          <DetailInput label="Label" value={service.label} onChange={(value) => setForm((current) => ({ ...current, services: current.services.map((row, rowIndex) => rowIndex === index ? { ...row, label: value } : row) }))} placeholder="24hr Pharmacy" />
          <DetailInput label="Note" value={service.note} onChange={(value) => setForm((current) => ({ ...current, services: current.services.map((row, rowIndex) => rowIndex === index ? { ...row, note: value } : row) }))} placeholder="5 min walk" />
        </RepeatableRow>
      ))}</div>
      <button type="button" onClick={() => setForm((current) => ({ ...current, services: [...current.services, { label: '', note: '' }] }))} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add service</button>
    </SectionPanel>
  );
}

function ExperienceEditor({ form, setForm }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>> }) {
  return (
    <SectionPanel title="Nearby experiences" note="Add memorable nearby activities guests can plan around this stay.">
      {form.experiences.length === 0 && <p className="rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No experiences yet.</p>}
      <div className="grid gap-3">{form.experiences.map((experience, index) => (
        <RepeatableRow key={experience.id ?? `experience-${index}`} label="Experience" index={index} total={form.experiences.length} onMove={(direction) => setForm((current) => ({ ...current, experiences: reorder(current.experiences, index, direction) }))} onRemove={() => setForm((current) => ({ ...current, experiences: current.experiences.filter((_, rowIndex) => rowIndex !== index) }))}>
          <DetailInput label="Title" value={experience.title} onChange={(value) => setForm((current) => ({ ...current, experiences: current.experiences.map((row, rowIndex) => rowIndex === index ? { ...row, title: value } : row) }))} placeholder="Boating at Bhimtal Lake" />
          <DetailInput label="Note" value={experience.note} onChange={(value) => setForm((current) => ({ ...current, experiences: current.experiences.map((row, rowIndex) => rowIndex === index ? { ...row, note: value } : row) }))} placeholder="10 min drive" />
        </RepeatableRow>
      ))}</div>
      <button type="button" onClick={() => setForm((current) => ({ ...current, experiences: [...current.experiences, { title: '', note: '' }] }))} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add experience</button>
    </SectionPanel>
  );
}

function DescriptionEditor({ category, form, setForm, source, editor, documentMode, editorStyles, tools, insertImage, toggleSource }: { category: keyof typeof categoryNames; form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>>; source: boolean; editor: ReturnType<typeof useEditor>; documentMode: boolean; editorStyles: string; tools: [LucideIcon, string, string, () => void][]; insertImage: () => void; toggleSource: () => void }) {
  return (
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
  );
}

function PhotosEditor({ category, form, imageUrl, setImageUrl, uploadMessage, setUploadMessage, uploading, upload, addImageUrl, moveImage, setFeatured, removeImage }: { category: keyof typeof categoryNames; form: ListingForm; imageUrl: string; setImageUrl: (value: string) => void; uploadMessage: string; setUploadMessage: (value: string) => void; uploading: boolean; upload: (event: ChangeEvent<HTMLInputElement>) => void; addImageUrl: () => void; moveImage: (index: number, offset: number) => void; setFeatured: (index: number) => void; removeImage: (index: number) => void }) {
  return (
    <div className="md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold text-[#173f35]">Photos <span className="font-normal text-[#6c7770]">{category === 'STAY' || category === 'ACTIVITY' ? 'minimum 5 to publish' : category === 'RENTAL' ? 'minimum 3 to publish' : 'minimum 2 to publish'}</span></p>
          <p className="mt-1 text-[11px] text-[#6c7770]">Use clear photos of the actual listing. Avoid text overlays.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#173f35] px-3 py-2 text-xs font-bold text-white"><Upload size={14} /> {uploading ? 'Uploading...' : 'Upload photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={upload} className="hidden" /></label>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d6d9d1] bg-white px-3 focus-within:border-[#24584a]">
          <LinkIcon size={14} className="shrink-0 text-[#6c7770]" />
          <input type="url" value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); if (uploadMessage) setUploadMessage(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl(); } }} placeholder="Paste an image URL" className="h-10 min-w-0 flex-1 outline-none" />
        </label>
        <button type="button" onClick={addImageUrl} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#173f35] px-4 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]">Add URL</button>
      </div>
      {uploadMessage && <p className="mt-2 text-xs text-[#a44a4a]">{uploadMessage}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{form.images.map((image, index) => <div key={`${image}-${index}`} className="relative overflow-hidden rounded-xl border border-[#d9d9dc] bg-[#f6f6f4]"><img src={image} alt={`${index === 0 ? 'Featured ' : ''}listing photo`} className="aspect-square w-full object-cover" /><div className="flex items-center justify-between gap-1 p-1"><button type="button" title="Move image left" aria-label="Move image left" disabled={index === 0} onClick={() => moveImage(index, -1)} className="p-1 disabled:opacity-30"><GripVertical size={14} /></button><button type="button" onClick={() => setFeatured(index)} className={`px-1 text-[10px] font-semibold ${index === 0 ? 'text-[#16704a]' : 'text-[#616161]'}`}>{index === 0 ? 'Cover' : 'Set cover'}</button><button type="button" title="Remove image" aria-label="Remove image" onClick={() => removeImage(index)} className="p-1 text-[#a44a4a]"><Trash2 size={14} /></button></div></div>)}</div>
      {form.images.length > 0 && form.images.length < 10 && <p className="mt-2 text-[11px] text-[#8a5a00]">Add {10 - form.images.length} more photo{10 - form.images.length === 1 ? '' : 's'} for a stronger listing gallery. Publishing is allowed once the minimum is met.</p>}
      {!form.images.length && <div className="mt-3 border border-dashed border-[#c9c9cc] p-8 text-center text-xs text-[#777]"><ImagePlus className="mx-auto mb-2" size={22} />No photos uploaded yet</div>}
    </div>
  );
}

function FacilitiesEditor({ form, setForm }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>> }) {
  return (
    <SectionPanel title="Stay facilities" note="Choose the facilities guests can expect. New stays start with all facilities selected.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{stayFacilityGroups.map((group) => { const Icon = facilityIcons[group.title as keyof typeof facilityIcons] || Info; return <fieldset key={group.title} className="rounded-xl border border-[#e1e4dc] bg-white p-3"><legend className="px-1 text-[12px] font-bold text-[#173f35]"><span className="inline-flex items-center gap-2"><Icon size={16} strokeWidth={1.8} />{group.title}</span></legend><div className="grid gap-2">{group.items.map((item) => <label key={`${group.title}-${item.key}`} className="flex items-start gap-2 text-[12px] font-normal text-[#526057]"><input type="checkbox" checked={form.stayFacilities[item.key] ?? true} onChange={(event) => setForm((current) => ({ ...current, stayFacilities: { ...current.stayFacilities, [item.key]: event.target.checked } }))} className="mt-0.5 accent-[#24584a]" /><span>{item.label}</span></label>)}</div></fieldset>; })}</div>
    </SectionPanel>
  );
}

function FaqEditor({ form, setForm, editingId }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>>; editingId?: string | null }) {
  return (
    <SectionPanel title="Frequently Asked Questions" note="Shown on the public stay page under Travelers are asking. Saved together with this stay.">
      <div className="mb-3 flex justify-end"><span className="rounded-full bg-[#eef4ef] px-2 py-1 text-[11px] font-bold text-[#24584a]">{form.faqs.length} added</span></div>
      {form.faqs.length === 0 && <p className="rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No FAQs yet. Add one below.</p>}
      <div className="grid gap-3">{form.faqs.map((faq, index) => <FaqRow key={faq.id ?? `new-${index}`} faq={faq} index={index} total={form.faqs.length} onChange={(next) => setForm((current) => ({ ...current, faqs: current.faqs.map((row, rowIndex) => rowIndex === index ? next : row) }))} onMove={(direction) => setForm((current) => ({ ...current, faqs: reorder(current.faqs, index, direction) }))} onRemove={() => setForm((current) => ({ ...current, faqs: current.faqs.filter((_, rowIndex) => rowIndex !== index) }))} />)}</div>
      <button type="button" onClick={() => setForm((current) => ({ ...current, faqs: [...current.faqs, { question: '', answer: '' }] }))} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add FAQ</button>
      {!editingId && form.faqs.length > 0 && <p className="mt-2 text-[11px] text-[#6c7770]">FAQs are saved when you save this new stay.</p>}
    </SectionPanel>
  );
}

function HouseRulesEditor({ form, setForm, resetHouseRules, clearHouseRules }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>>; resetHouseRules: () => void; clearHouseRules: () => void }) {
  return (
    <SectionPanel title="House rules" note="Saved per listing. Reset to the standard template, then edit to taste.">
      <div className="mb-3 flex justify-end"><button type="button" onClick={resetHouseRules} className="rounded-full bg-[#eef4ef] px-2.5 py-1 text-[11px] font-bold text-[#24584a] hover:bg-[#dcefe2]">Reset to template</button></div>
      {form.houseRules.length === 0 && <p className="rounded-xl border border-dashed border-[#c9c9cc] bg-white p-4 text-center text-xs text-[#777]">No house rules yet. Use the template below.</p>}
      <div className="grid gap-3">{form.houseRules.map((rule, index) => <HouseRulesRow key={rule.id ?? `new-${index}`} rule={rule} index={index} total={form.houseRules.length} onChange={(next) => setForm((current) => ({ ...current, houseRules: current.houseRules.map((row, rowIndex) => rowIndex === index ? next : row) }))} onMove={(direction) => setForm((current) => ({ ...current, houseRules: reorder(current.houseRules, index, direction) }))} onRemove={() => setForm((current) => ({ ...current, houseRules: current.houseRules.filter((_, rowIndex) => rowIndex !== index) }))} />)}</div>
      <div className="mt-3 flex gap-2"><button type="button" onClick={() => setForm((current) => ({ ...current, houseRules: [...current.houseRules, { title: '', text: '' }] }))} className="inline-flex items-center gap-2 rounded-xl border border-[#173f35] px-4 py-2 text-xs font-bold text-[#173f35] hover:bg-[#eef4ef]"><Plus size={14} /> Add rule</button><button type="button" onClick={clearHouseRules} className="inline-flex items-center gap-2 rounded-xl border border-[#d9d9dc] px-4 py-2 text-xs font-bold text-[#6c7770] hover:bg-white"><Trash2 size={14} /> Clear all</button></div>
    </SectionPanel>
  );
}

function ReviewPanel({ editingId, title, reviewCount, open }: { editingId?: string | null; title: string; reviewCount: number | null; open: () => void }) {
  return (
    <SectionPanel title="Guest reviews" note="Approve, reject, edit, or add reviews for this stay. Each action saves immediately.">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#6c7770]">{editingId ? title : 'Save this stay once to unlock review management.'}</p>
        <button type="button" disabled={!editingId} onClick={open} className="inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-4 py-2 text-xs font-bold text-white hover:bg-[#0d241d] disabled:opacity-40"><Star size={14} /> Manage reviews{reviewCount !== null ? ` (${reviewCount})` : ''}</button>
      </div>
    </SectionPanel>
  );
}

function StatusField({ form, setForm }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>> }) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-[#173f35] md:col-span-2">
      <span>Status</span>
      <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-xl border border-[#d6d9d1] px-3 font-normal">
        <option value="DRAFT">Draft</option>
        <option value="LIVE">Live</option>
        <option value="PAUSED">Paused</option>
        <option value="PENDING_REVIEW">Pending review</option>
      </select>
    </label>
  );
}

function RideFields({ form, setDetail }: { form: ListingForm; setDetail: (name: string, value: string) => void }) {
  return <><DetailInput label="Vehicle type" value={valueOf(form.details, 'vehicleType')} onChange={(value) => setDetail('vehicleType', value)} /><DetailInput label="Passenger capacity" value={valueOf(form.details, 'passengerCapacity')} onChange={(value) => setDetail('passengerCapacity', value)} type="number" /><DetailInput label="Route or custom pickup" value={valueOf(form.details, 'route')} onChange={(value) => setDetail('route', value)} /><DetailInput label="Estimated duration" value={valueOf(form.details, 'duration')} onChange={(value) => setDetail('duration', value)} /><DetailTextarea label="Driver notes" value={valueOf(form.details, 'driverNotes')} onChange={(value) => setDetail('driverNotes', value)} /><DetailTextarea label="Waiting, toll, and fuel notes" value={valueOf(form.details, 'pricingNotes')} onChange={(value) => setDetail('pricingNotes', value)} /></>;
}

function RentalFields({ form, setDetail }: { form: ListingForm; setDetail: (name: string, value: string) => void }) {
  return <><DetailInput label="Vehicle type" value={valueOf(form.details, 'vehicleType')} onChange={(value) => setDetail('vehicleType', value)} placeholder="Bike or scooty" /><DetailInput label="Make / model" value={valueOf(form.details, 'makeModel')} onChange={(value) => setDetail('makeModel', value)} /><DetailInput label="Year" value={valueOf(form.details, 'year')} onChange={(value) => setDetail('year', value)} type="number" /><DetailInput label="Registration / license plate" value={valueOf(form.details, 'registrationNumber')} onChange={(value) => setDetail('registrationNumber', value)} /><DetailInput label="Transmission" value={valueOf(form.details, 'transmission')} onChange={(value) => setDetail('transmission', value)} /><DetailInput label="Daily price" value={valueOf(form.details, 'dailyPrice')} onChange={(value) => setDetail('dailyPrice', value)} type="number" /><DetailInput label="Quantity available" value={valueOf(form.details, 'quantity')} onChange={(value) => setDetail('quantity', value)} type="number" /><DetailInput label="Mileage / odometer" value={valueOf(form.details, 'mileage')} onChange={(value) => setDetail('mileage', value)} /><DetailInput label="Fuel type" value={valueOf(form.details, 'fuelType')} onChange={(value) => setDetail('fuelType', value)} /><DetailInput label="Capacity" value={valueOf(form.details, 'capacity')} onChange={(value) => setDetail('capacity', value)} /><DetailInput label="Pickup / delivery options" value={valueOf(form.details, 'pickupOptions')} onChange={(value) => setDetail('pickupOptions', value)} /><DetailTextarea label="Notable features" value={valueOf(form.details, 'features')} onChange={(value) => setDetail('features', value)} placeholder="Helmet included, phone mount" /><DetailTextarea label="FAQ" value={valueOf(form.details, 'faq')} onChange={(value) => setDetail('faq', value)} placeholder="Question and answer pairs" /></>;
}

function ActivityFields({ form, setDetail }: { form: ListingForm; setDetail: (name: string, value: string) => void }) {
  return <><DetailInput label="Minimum group size" value={valueOf(form.details, 'groupMin')} onChange={(value) => setDetail('groupMin', value)} type="number" /><DetailInput label="Maximum group size" value={valueOf(form.details, 'groupMax')} onChange={(value) => setDetail('groupMax', value)} type="number" /><DetailTextarea label="What is included" value={valueOf(form.details, 'included')} onChange={(value) => setDetail('included', value)} /><DetailTextarea label="Safety information" value={valueOf(form.details, 'safetyInformation')} onChange={(value) => setDetail('safetyInformation', value)} /><DetailTextarea label="About the guide/operator" value={valueOf(form.details, 'guideAbout')} onChange={(value) => setDetail('guideAbout', value)} /><DetailInput label="Duration" value={valueOf(form.details, 'duration')} onChange={(value) => setDetail('duration', value)} /><DetailInput label="Meeting point" value={valueOf(form.details, 'meetingPoint')} onChange={(value) => setDetail('meetingPoint', value)} /></>;
}
