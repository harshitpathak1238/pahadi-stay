'use client';

import Link from 'next/link';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, Bold, Code2, Edit3, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Pencil, Plus, Quote, Save, Trash2, X, type LucideIcon } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';

type Category = 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY';
type Section = Category | 'PACKAGE';
type Listing = { id: string; title: string; slug: string; category: Category; location: string; sellPrice: string | number; basePrice: string | number; bikeQuantity?: number; scootyQuantity?: number; status: string; description: string; images?: string[]; amenities?: string[] };
type TravelPackage = { id: string; title: string; description: string; price: string | number; listingIds?: string[] };
type Form = { slug: string; title: string; description: string; location: string; basePrice: string; sellPrice: string; bikeQuantity: string; scootyQuantity: string; images: string; amenities: string; status: string; price: string; listingIds: string[] };

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
  images: '',
  amenities: '',
  status: 'DRAFT',
  price: '',
  listingIds: [],
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
        images: (listing.images || []).join(', '),
        amenities: (listing.amenities || []).join(', '),
        status: listing.status,
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
    const asList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
    const payload = {
      slug: form.slug,
      category: section,
      title: form.title,
      description: form.description,
      location: form.location,
      basePrice: Number(form.basePrice),
      sellPrice: Number(form.sellPrice),
      bikeQuantity: Number(form.bikeQuantity),
      scootyQuantity: Number(form.scootyQuantity),
      images: asList(form.images),
      amenities: asList(form.amenities),
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

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; multiline?: boolean; hint?: string }) {
  return (
    <label className={`grid gap-2 sans text-sm font-bold text-[#173f35] ${multiline ? 'md:col-span-2' : ''}`}>
      <span className="flex items-center gap-2">
        {label}
        {hint && <span className="font-normal text-[#6c7770]">{hint}</span>}
      </span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-24 rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" />
      )}
    </label>
  );
}

function ListingEditor({ form, setForm, busy, message, cancel, save }: { form: Form; setForm: Dispatch<SetStateAction<Form>>; busy: boolean; message: string; cancel: () => void; save: (event: React.FormEvent) => void }) {
  return (
    <form onSubmit={save} className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7">
      {message && <p className="mb-4 rounded-xl bg-[#e2eee7] p-3 sans text-sm text-[#24584a]">{message}</p>}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-[#616161]">
          <button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Back</button>
          <span>/ listing editor</span>
        </div>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 bg-[#173f35] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"><Save size={14} /> Save</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Enter listing title" />
        <Field label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} placeholder="listing-slug" />
        <Field label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} placeholder="Basital, Kumaon" />
        <Field label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} placeholder="DRAFT" />
        <Field label="Base price" type="number" value={form.basePrice} onChange={(value) => setForm((current) => ({ ...current, basePrice: value }))} placeholder="0" />
        <Field label="Selling price" type="number" value={form.sellPrice} onChange={(value) => setForm((current) => ({ ...current, sellPrice: value }))} placeholder="0" />
        <Field label="Bike quantity" type="number" value={form.bikeQuantity} onChange={(value) => setForm((current) => ({ ...current, bikeQuantity: value }))} placeholder="0" />
        <Field label="Scooty quantity" type="number" value={form.scootyQuantity} onChange={(value) => setForm((current) => ({ ...current, scootyQuantity: value }))} placeholder="0" />
        <Field label="Images" value={form.images} onChange={(value) => setForm((current) => ({ ...current, images: value }))} placeholder="image-1.jpg, image-2.jpg" hint="comma-separated" />
        <Field label="Amenities" value={form.amenities} onChange={(value) => setForm((current) => ({ ...current, amenities: value }))} placeholder="WiFi, Mountain view" hint="comma-separated" />
        <div className="md:col-span-2">
          <Field label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="Tell guests about the spot, style, and experience." multiline />
        </div>
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
