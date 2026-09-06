'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import { getFullBlogDocument, isFullBlogDocument, normalizeBlogHtml } from '@/lib/sanitize-html';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bold, Code2, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Pencil, Plus, Quote, Save, Search, Trash2, X, type LucideIcon } from 'lucide-react';
import { prepareImageForUpload } from '@/lib/client-image-upload';
import { ResizableImage } from './ResizableImage';
import { GenericArticle, GenericDiv, GenericSpan } from './BlogEditorExtensions';

type Author = { id: string; name: string | null; email: string | null };
type Blog = { id: string; slug: string; title: string; metaTitle: string; metaDescription: string; excerpt: string; body: string; customCss: string | null; authorName: string; authorId: string | null; category: string; primaryKeyword: string; tags: string[]; featuredImage: string | null; imageAltText: string | null; status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'; scheduledAt: string | null; publishedAt: string | null };
type Form = Omit<Blog, 'id' | 'tags'> & { id?: string; tags: string };
type MediaAsset = { id: string; url: string; filename: string; mimeType: string; thumbnailUrl: string | null };

const empty = (): Form => ({ slug: '', title: '', metaTitle: '', metaDescription: '', excerpt: '', body: '<p></p>', customCss: '', authorName: '', authorId: null, category: '', primaryKeyword: '', tags: '', featuredImage: null, imageAltText: '', status: 'DRAFT', scheduledAt: null, publishedAt: null });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normalizeHtml = (html: string) => {
  if (typeof DOMParser === 'undefined') return html;
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script, style, link, meta, title, head').forEach((element) => element.remove());
  return document.body.innerHTML.trim() || '<p></p>';
};

export function BlogManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch(`/api/admin/blogs?search=${encodeURIComponent(search)}&status=${status}&sort=${sort}`, { cache: 'no-store' });
    if (response.ok) {
      const result = await response.json();
      setBlogs(result.blogs);
      setAuthors(result.authors);
    } else setMessage('Could not load blog posts.');
  };

  useEffect(() => { load(); }, [search, status, sort]);

  const change = (key: keyof Form, value: string | null) => setForm((current) => current ? { ...current, [key]: value } : current);

  const upload = async (file: File) => {
    const data = new FormData();
    let preparedFile: File;
    try { preparedFile = await prepareImageForUpload(file); } catch { setMessage('The selected image could not be read.'); return null; }
    data.append('file', preparedFile);
    setBusy(true);
    try {
      const response = await fetch('/api/admin/media', { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(result.error || `Image upload failed (${response.status}).`); return null; }
      if (typeof result.asset?.url !== 'string') { setMessage('Image upload returned no usable URL.'); return null; }
      setMessage('Image uploaded successfully and added to the editor.');
      return result.asset.url;
    } catch { setMessage('Could not reach the image upload service.'); return null; }
    finally { setBusy(false); }
  };

  const removeUploadedImage = async (url: string) => {
    setBusy(true);
    try {
      const mediaResponse = await fetch(`/api/admin/media?search=${encodeURIComponent(url.split('/').pop() || '')}&page=1`, { cache: 'no-store' });
      const mediaResult = await mediaResponse.json().catch(() => ({}));
      const asset = mediaResult.assets?.find((item: { url: string }) => item.url === url);
      if (!asset) { change('featuredImage', null); change('imageAltText', null); return; }
      const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [asset.id] }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 409) setMessage(result.error || 'Could not remove the uploaded image.');
      change('featuredImage', null);
      change('imageAltText', null);
    } catch { setMessage('Could not reach the image removal service.'); }
    finally { setBusy(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const localErrors = [
      form.metaTitle.trim().length > 160 ? 'SEO title must be 160 characters or fewer.' : '', 
      form.metaDescription.trim().length > 320 ? 'SEO meta description must be 320 characters or fewer.' : '',
      form.primaryKeyword.trim().length > 100 ? 'Primary keyword must be 100 characters or fewer.' : '',
    ].filter(Boolean);
    if (localErrors.length) { setMessage(localErrors.join(' ')); return; }
    setBusy(true);
    const payload = { slug: form.slug, title: form.title, metaTitle: form.metaTitle, metaDescription: form.metaDescription, excerpt: form.excerpt, body: form.body, customCss: form.customCss || null, authorName: form.authorName, authorId: form.authorId, category: form.category, primaryKeyword: form.primaryKeyword, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), featuredImage: form.featuredImage || null, imageAltText: form.imageAltText || null, status: String(form.status || 'DRAFT').trim().toUpperCase(), scheduledAt: form.status === 'SCHEDULED' ? form.scheduledAt : null };
    try {
      const response = await fetch(editing ? `/api/admin/blogs/${editing}` : '/api/admin/blogs', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error(`Blog save failed (${response.status}): ${JSON.stringify(result)}`);
        const fieldErrors = result.details?.fieldErrors ? Object.entries(result.details.fieldErrors).flatMap(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`).join(' ') : '';
        setMessage([result.error || `Could not save blog (${response.status}).`, fieldErrors, typeof result.details === 'string' ? result.details : ''].filter(Boolean).join(' '));
        return;
      }
      setForm(null); setEditing(null); setMessage('Blog saved.'); load();
    } catch { setMessage('Could not reach the blog service. Please try again.'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this blog permanently?')) return;
    const response = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
    if (response.ok) load(); else setMessage('Could not delete blog.');
  };

  if (form) return <Editor form={form} change={change} authors={authors} save={submit} upload={upload} removeUploadedImage={removeUploadedImage} busy={busy} message={message} cancel={() => { setForm(null); setEditing(null); }} />;

  return <>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#777]">Content</p><h1 className="mt-2 text-[26px] font-semibold">Blog</h1><p className="mt-1 text-[13px] text-[#777]">Manage stories, search previews, and scheduled publishing.</p></div><button onClick={() => { setEditing(null); setForm(empty()); }} className="inline-flex h-9 items-center justify-center gap-2 rounded-[4px] bg-[#303030] px-4 text-[12px] font-semibold text-white"><Plus size={15} /> Add new post</button></div>
    {message && <p className="mt-4 rounded-[4px] bg-[#e2eee7] p-3 text-[13px] text-[#24584a]">{message}</p>}
    <div className="mt-6 flex flex-col gap-3 border border-[#e1e1e3] bg-white p-3 md:flex-row"><label className="flex min-w-0 flex-1 items-center gap-2 border border-[#d9d9dc] px-3"><Search size={16} className="text-[#777]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search posts" className="h-9 min-w-0 flex-1 text-[13px] outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 border border-[#d9d9dc] px-3 text-[12px]"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PUBLISHED">Published</option></select><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 border border-[#d9d9dc] px-3 text-[12px]"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>
    <div className="mt-4 overflow-x-auto border border-[#e1e1e3] bg-white"><table className="w-full min-w-[760px] text-left text-[13px]"><thead className="border-b border-[#e1e1e3] bg-[#fafafa] text-[11px] uppercase tracking-[.08em] text-[#777]"><tr><th className="p-3">Post</th><th className="p-3">Author</th><th className="p-3">Status</th><th className="p-3">Publish date</th><th className="p-3" /></tr></thead><tbody>{blogs.map((blog) => <tr key={blog.id} className="border-b border-[#eee] last:border-0"><td className="p-3"><div className="flex items-center gap-3">{blog.featuredImage ? <img src={blog.featuredImage} alt="" className="h-12 w-16 object-cover" /> : <div className="grid h-12 w-16 place-items-center bg-[#f0f0f1] text-[#888]"><ImagePlus size={17} /></div>}<div><p className="font-semibold">{blog.title}</p><p className="mt-1 text-[11px] text-[#777]">/{blog.slug}</p></div></div></td><td className="p-3">{blog.authorName}</td><td className="p-3"><span className="bg-[#f0f0f1] px-2 py-1 text-[11px] font-semibold">{blog.status.toLowerCase()}</span></td><td className="p-3 text-[#616161]">{blog.scheduledAt || blog.publishedAt ? new Date(blog.scheduledAt || blog.publishedAt || '').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'}</td><td className="p-3"><div className="flex justify-end gap-1"><button onClick={() => { setEditing(blog.id); setForm({ ...blog, tags: blog.tags.join(', '), scheduledAt: blog.scheduledAt?.slice(0, 16) || null }); }} aria-label={`Edit ${blog.title}`} className="p-2 hover:bg-[#f0f0f1]"><Pencil size={15} /></button><button onClick={() => remove(blog.id)} aria-label={`Delete ${blog.title}`} className="p-2 text-[#9f3d3d]"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{!blogs.length && <p className="p-10 text-center text-[13px] text-[#777]">No posts match these filters.</p>}</div>
  </>;
}

function MediaPicker({ onSelect, onClose, upload }: { onSelect: (url: string) => void; onClose: () => void; upload: (file: File) => Promise<string | null> }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/admin/media?type=images&page=1', { cache: 'no-store' }).then((response) => response.json()).then((result) => setAssets(Array.isArray(result.assets) ? result.assets : [])).finally(() => setLoading(false)); }, []);
  const chooseUpload = async (file: File) => { const url = await upload(file); if (url) { setAssets((current) => [{ id: url, url, filename: file.name, mimeType: file.type, thumbnailUrl: url }, ...current]); onSelect(url); } };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Choose image"><div className="max-h-[85vh] w-full max-w-3xl overflow-auto bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Choose from media library</h2><button type="button" onClick={onClose} aria-label="Close image picker"><X size={18} /></button></div><label className="mt-4 flex min-h-28 cursor-pointer items-center justify-center border-2 border-dashed border-[#b9d5c5] bg-[#f1f8f3] text-sm font-semibold text-[#24584a]">+ Upload new<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && chooseUpload(event.target.files[0])} /></label>{loading ? <p className="p-8 text-center text-sm text-[#777]">Loading media...</p> : <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{assets.map((asset) => <button type="button" key={asset.id} onClick={() => onSelect(asset.url)} className="overflow-hidden border border-[#d9d9dc] text-left hover:border-[#24584a]"><img src={asset.thumbnailUrl || asset.url} alt={asset.filename} className="aspect-square w-full object-cover" /><span className="block truncate p-2 text-[11px]">{asset.filename}</span></button>)}{!assets.length && <p className="col-span-full p-6 text-center text-sm text-[#777]">No images uploaded yet.</p>}</div>}</div></div>;
}

function Editor({ form, change, authors, save, upload, removeUploadedImage, busy, message, cancel }: { form: Form; change: (key: keyof Form, value: string | null) => void; authors: Author[]; save: (event: React.FormEvent) => void; upload: (file: File) => Promise<string | null>; removeUploadedImage: (url: string) => Promise<void>; busy: boolean; message: string; cancel: () => void }) {
  const documentMode = isFullBlogDocument(form.body);
  const [source, setSource] = useState(documentMode);
  const [dirty, setDirty] = useState(true);
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState<'inline' | 'featured' | null>(null);
  const [sourceNotice, setSourceNotice] = useState(false);
    const [selectionVersion, setSelectionVersion] = useState(0);
  const editor = useEditor({ extensions: [StarterKit.configure({ link: false }), GenericArticle, GenericDiv, GenericSpan, ResizableImage, Link.configure({ openOnClick: false }), Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, Youtube.configure({ controls: true, nocookie: true })], content: normalizeBlogHtml(form.body || '<p></p>'), onUpdate: ({ editor: current }) => { if (!source) { change('body', current.getHTML()); setDirty(true); setSelectionVersion((version) => version + 1); } }, onSelectionUpdate: () => setSelectionVersion((version) => version + 1), editorProps: { attributes: { class: 'prose min-h-[300px] max-w-none p-4 outline-none' } } });
  useEffect(() => { if (!documentMode && !source && editor) { const content = normalizeHtml(form.body || '<p></p>'); if (editor.getHTML() !== content) editor.commands.setContent(content, { emitUpdate: false }); if (content !== form.body) change('body', content); } }, [documentMode, editor, form.body, source]);
  const active = (name: string) => { void selectionVersion; return Boolean(editor?.isActive(name)); };
  const toggleSource = () => { if (source && editor) { const fullDocument = isFullBlogDocument(form.body || ''); const extracted = fullDocument ? getFullBlogDocument(form.body).styles : ''; const normalized = normalizeBlogHtml(form.body || '<p></p>'); editor.commands.setContent(normalized, { emitUpdate: false }); change('body', normalized); if (extracted) change('customCss', extracted); setSourceNotice(normalized !== form.body || Boolean(extracted)); } setSource((value) => !value); };
  const selectInlineImage = (url: string) => {
    if (source) {
      change('body', `${form.body}\n<img src="${url}" alt="">`);
    } else if (editor) {
      const pos = editor.state.selection.from;
      editor.chain().focus().insertContentAt(pos, { type: 'image', attrs: { src: url } }).run();
    }
    setDirty(true);
    setPicker(null);
  };
  const selectFeaturedImage = (url: string) => { change('featuredImage', url); setDirty(true); setPicker(null); };
  const field = (key: keyof Form, label: string, _required = false, minLength?: number, maxLength?: number) => { const optionalMeta = ['metaTitle', 'metaDescription', 'primaryKeyword'].includes(String(key)); return <label className="grid gap-1 text-[12px] font-semibold">{label}<input required={false} minLength={optionalMeta ? undefined : minLength} maxLength={maxLength} value={String(form[key] ?? '')} onChange={(event) => { const value = event.target.value; change(key, value); if (key === 'title' && !form.id) change('slug', slugify(value)); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 text-[13px] font-normal" /></label>; };
  const tools: [LucideIcon, string, string, () => void][] = [[Bold, 'Bold', 'bold', () => editor?.chain().focus().toggleBold().run()], [Italic, 'Italic', 'italic', () => editor?.chain().focus().toggleItalic().run()], [List, 'Bulleted list', 'bulletList', () => editor?.chain().focus().toggleBulletList().run()], [ListOrdered, 'Numbered list', 'orderedList', () => editor?.chain().focus().toggleOrderedList().run()], [Quote, 'Quote', 'blockquote', () => editor?.chain().focus().toggleBlockquote().run()], [LinkIcon, 'Link', 'link', () => { const url = window.prompt('Link URL'); if (url) editor?.chain().focus().setLink({ href: url }).run(); }], [Bold, 'Insert table', 'table', () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()], [Italic, 'Embed video', 'video', () => { const url = window.prompt('YouTube or Vimeo URL'); if (url) editor?.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run(); }]];
  const bodySizeWarning = form.body.length > 64 * 1024 ? `Body is ${(form.body.length / 1024).toFixed(1)} KB. Large documents may make editing slower.` : '';
  return <form onSubmit={save}>{picker && <MediaPicker upload={upload} onClose={() => setPicker(null)} onSelect={picker === 'inline' ? selectInlineImage : selectFeaturedImage} />}{message && <p className="mb-5 rounded-[4px] border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}{sourceNotice && <p className="mb-5 rounded-[4px] border border-[#b9d5c5] bg-[#f1f8f3] p-3 text-[13px] text-[#24584a]">Removed document-level HTML — only the content itself is kept</p>}{bodySizeWarning && <p className="mb-5 border border-[#ead7ad] bg-[#fffaf0] p-3 text-[13px] text-[#8a5a00]">{bodySizeWarning}</p>}
    <div className="mb-5 flex items-center gap-3 text-[12px] text-[#616161]"><button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Posts</button><span>/ Blog editor</span></div>
    <div className="flex items-center justify-between gap-3"><h1 className="text-[26px] font-semibold">{form.title || 'New post'}</h1><div className="flex gap-2"><button type="button" onClick={() => setPreview(!preview)} className="border border-[#d9d9dc] bg-white px-3 py-2 text-[12px] font-semibold">{preview ? 'Edit' : 'Preview'}</button><button disabled={busy} className="inline-flex items-center gap-2 bg-[#303030] px-4 py-2 text-[12px] font-semibold text-white"><Save size={14} /> Save</button></div></div>
    {preview ? <div className="prose mt-6 max-w-none border border-[#d9d9dc] bg-white p-8" dangerouslySetInnerHTML={{ __html: form.body }} /> : <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="grid gap-5">{field('title', 'Title', false, 2, 160)}{field('slug', 'URL slug / handle', false, 2, 160)}<div className="border border-[#d9d9dc] bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-[#e1e1e3] bg-[#fafafa] p-2">{tools.map(([Icon, label, mark, onClick]) => <button type="button" title={label} aria-label={label} aria-pressed={active(mark)} key={label} onClick={onClick} className={`grid h-8 w-8 place-items-center transition ${active(mark) ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}><Icon size={15} /></button>)}<button type="button" title="Heading 2" aria-pressed={active('heading')} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`h-8 w-8 text-xs font-bold transition ${active('heading') ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}>H2</button><button type="button" title="Insert image" aria-label="Insert image" onClick={() => setPicker('inline')} className="grid h-8 w-8 place-items-center hover:bg-[#e9e9eb]"><ImagePlus size={15} /></button><button type="button" title="HTML source" aria-pressed={source} onClick={toggleSource} className={`grid h-8 w-8 place-items-center transition ${source ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}><Code2 size={15} /></button></div>{source ? <textarea value={form.body} onChange={(event) => { change('body', event.target.value); setDirty(true); }} className="min-h-[332px] w-full p-4 font-mono text-[12px] outline-none" /> : <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) upload(file).then((url) => url && selectInlineImage(url)); }}><EditorContent editor={editor} /></div>}</div>{field('excerpt', 'Excerpt / summary', true, 20, 320)}{field('metaDescription', 'SEO meta description', true, 50, 320)}</div><aside className="grid content-start gap-4">{field('category', 'Category', true, 2, 60)}{field('primaryKeyword', 'Primary keyword', true, 2, 100)}{field('tags', 'Tags (comma separated)')}{field('metaTitle', 'SEO title', true, 2, 160)}<label className="grid gap-1 text-[12px] font-semibold">Custom CSS (advanced)<textarea value={String(form.customCss || '')} maxLength={30000} onChange={(event) => { change('customCss', event.target.value); setDirty(true); }} className="min-h-40 w-full resize-y border border-[#d9d9dc] bg-white p-2 font-mono text-[12px] font-normal" /><span className="text-[11px] font-normal text-[#777]">Optional CSS scoped to this post only — for custom fonts, colors, or layout not achievable in the rich text editor.</span></label><label className="grid gap-1 text-[12px] font-semibold">Author<select required value={String(form.authorId || '')} onChange={(event) => { const author = authors.find((item) => item.id === event.target.value); change('authorId', event.target.value || null); if (author) change('authorName', author.name || author.email || 'Admin'); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 py-2 text-[13px] font-normal"><option value="">Select admin</option>{authors.map((author) => <option key={author.id} value={author.id}>{author.name || author.email}</option>)}</select></label><label className="grid gap-1 text-[12px] font-semibold">Status<select value={form.status} onChange={(event) => { change('status', event.target.value); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 py-2 text-[13px] font-normal"><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PUBLISHED">Published</option></select></label>{form.status === 'SCHEDULED' && <label className="grid gap-1 text-[12px] font-semibold">Publish at<input required type="datetime-local" value={String(form.scheduledAt || '')} onChange={(event) => { change('scheduledAt', event.target.value); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 py-2 text-[12px] font-normal" /></label>}<label className="grid gap-1 text-[12px] font-semibold">Featured image<button type="button" onClick={() => setPicker('featured')} className="h-9 border border-[#d9d9dc] bg-white px-2 text-left text-[13px] font-normal">Choose from media library</button>{form.featuredImage && <div className="mt-2 flex items-center gap-2"><img src={form.featuredImage} alt={String(form.imageAltText || '')} className="aspect-video min-w-0 flex-1 object-cover" /><button type="button" disabled={busy} onClick={() => removeUploadedImage(form.featuredImage!)} className="inline-flex shrink-0 items-center gap-1 border border-[#d9d9dc] px-2 py-1 text-[11px] font-semibold text-[#9f3d3d]"><Trash2 size={13} /> Remove</button></div>}</label>{field('imageAltText', 'Featured image alt text')}</aside></div>}
    {dirty && <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between border border-[#b9d5c5] bg-[#f1f8f3] p-3"><span className="text-[12px] font-semibold">Unsaved changes</span><button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 text-[12px] font-semibold"><X size={14} /> Discard</button></div>}
  </form>;
}
