'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { normalizeBlogHtml } from '@/lib/sanitize-html';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bold, Code2, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Pencil, Plus, Quote, Save, Search, Trash2, X, type LucideIcon } from 'lucide-react';

type Author = { id: string; name: string | null; email: string | null };
type Blog = { id: string; slug: string; title: string; metaTitle: string; metaDescription: string; excerpt: string; body: string; authorName: string; authorId: string | null; category: string; primaryKeyword: string; tags: string[]; featuredImage: string | null; imageAltText: string | null; status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'; scheduledAt: string | null; publishedAt: string | null };
type Form = Omit<Blog, 'id' | 'tags'> & { id?: string; tags: string };

const empty = (): Form => ({ slug: '', title: '', metaTitle: '', metaDescription: '', excerpt: '', body: '<p></p>', authorName: '', authorId: null, category: '', primaryKeyword: '', tags: '', featuredImage: null, imageAltText: '', status: 'DRAFT', scheduledAt: null, publishedAt: null });
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
    data.append('file', file);
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
    const payload = { slug: form.slug, title: form.title, metaTitle: form.metaTitle, metaDescription: form.metaDescription, excerpt: form.excerpt, body: form.body, authorName: form.authorName, authorId: form.authorId, category: form.category, primaryKeyword: form.primaryKeyword, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), featuredImage: form.featuredImage || null, imageAltText: form.imageAltText || null, status: String(form.status || 'DRAFT').trim().toUpperCase(), scheduledAt: form.status === 'SCHEDULED' ? form.scheduledAt : null };
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

function Editor({ form, change, authors, save, upload, removeUploadedImage, busy, message, cancel }: { form: Form; change: (key: keyof Form, value: string | null) => void; authors: Author[]; save: (event: React.FormEvent) => void; upload: (file: File) => Promise<string | null>; removeUploadedImage: (url: string) => Promise<void>; busy: boolean; message: string; cancel: () => void }) {
  const [source, setSource] = useState(() => /<!doctype\s+html|<html[\s>]/i.test(form.body));
  const [dirty, setDirty] = useState(true);
  const [preview, setPreview] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const editor = useEditor({ extensions: [StarterKit.configure({ link: false }), Image, Link.configure({ openOnClick: false })], content: normalizeBlogHtml(form.body || '<p></p>'), onUpdate: ({ editor: current }) => { change('body', current.getHTML()); setDirty(true); setSelectionVersion((version) => version + 1); }, onSelectionUpdate: () => setSelectionVersion((version) => version + 1), editorProps: { attributes: { class: 'prose min-h-[300px] max-w-none p-4 outline-none' } } });
  useEffect(() => { if (!source && editor) { const content = normalizeHtml(form.body || '<p></p>'); if (editor.getHTML() !== content) editor.commands.setContent(content, { emitUpdate: false }); if (content !== form.body) change('body', content); } }, [editor, form.body, source]);
  const active = (name: string) => { void selectionVersion; return Boolean(editor?.isActive(name)); };
  const toggleSource = () => { if (source && editor) editor.commands.setContent(normalizeBlogHtml(form.body || '<p></p>'), { emitUpdate: false }); setSource((value) => !value); };
  const fullDocument = /<!doctype\s+html|<html[\s>]/i.test(form.body);
  const inlineUpload = async (file: File) => { const url = await upload(file); if (url) editor?.chain().focus().setImage({ src: url }).run(); };
  const field = (key: keyof Form, label: string, _required = false, minLength?: number, maxLength?: number) => { const optionalMeta = ['metaTitle', 'metaDescription', 'primaryKeyword'].includes(String(key)); return <label className="grid gap-1 text-[12px] font-semibold">{label}<input required={false} minLength={optionalMeta ? undefined : minLength} maxLength={maxLength} value={String(form[key] ?? '')} onChange={(event) => { const value = event.target.value; change(key, value); if (key === 'title' && !form.id) change('slug', slugify(value)); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 text-[13px] font-normal" /></label>; };
  const tools: [LucideIcon, string, string, () => void][] = [[Bold, 'Bold', 'bold', () => editor?.chain().focus().toggleBold().run()], [Italic, 'Italic', 'italic', () => editor?.chain().focus().toggleItalic().run()], [List, 'Bulleted list', 'bulletList', () => editor?.chain().focus().toggleBulletList().run()], [ListOrdered, 'Numbered list', 'orderedList', () => editor?.chain().focus().toggleOrderedList().run()], [Quote, 'Quote', 'blockquote', () => editor?.chain().focus().toggleBlockquote().run()], [LinkIcon, 'Link', 'link', () => { const url = window.prompt('Link URL'); if (url) editor?.chain().focus().setLink({ href: url }).run(); }]];
  return <form onSubmit={save}>{message && <p className="mb-5 rounded-[4px] border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
    <div className="mb-5 flex items-center gap-3 text-[12px] text-[#616161]"><button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 font-semibold"><ArrowLeft size={14} /> Posts</button><span>/ Blog editor</span></div>
    <div className="flex items-center justify-between gap-3"><h1 className="text-[26px] font-semibold">{form.title || 'New post'}</h1><div className="flex gap-2"><button type="button" onClick={() => setPreview(!preview)} className="border border-[#d9d9dc] bg-white px-3 py-2 text-[12px] font-semibold">{preview ? 'Edit' : 'Preview'}</button><button disabled={busy} className="inline-flex items-center gap-2 bg-[#303030] px-4 py-2 text-[12px] font-semibold text-white"><Save size={14} /> Save</button></div></div>
    {preview ? <div className="prose mt-6 max-w-none border border-[#d9d9dc] bg-white p-8" dangerouslySetInnerHTML={{ __html: form.body }} /> : <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="grid gap-5">{field('title', 'Title', false, 2, 160)}{field('slug', 'URL slug / handle', false, 2, 160)}<div className="border border-[#d9d9dc] bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-[#e1e1e3] bg-[#fafafa] p-2">{tools.map(([Icon, label, mark, onClick]) => <button type="button" title={label} aria-label={label} aria-pressed={active(mark)} key={label} onClick={onClick} className={`grid h-8 w-8 place-items-center transition ${active(mark) ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}><Icon size={15} /></button>)}<button type="button" title="Heading 2" aria-pressed={active('heading')} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`h-8 w-8 text-xs font-bold transition ${active('heading') ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}>H2</button><label title="Insert image" className="grid h-8 w-8 cursor-pointer place-items-center hover:bg-[#e9e9eb]"><ImagePlus size={15} /><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && inlineUpload(event.target.files[0])} /></label><button type="button" title="HTML source" aria-pressed={source} onClick={() => setSource(!source)} className={`grid h-8 w-8 place-items-center transition ${source ? 'bg-[#dcefe2] text-[#24584a] ring-1 ring-inset ring-[#8db9a0]' : 'hover:bg-[#e9e9eb]'}`}><Code2 size={15} /></button></div>{source ? <textarea value={form.body} onChange={(event) => { change('body', event.target.value); setDirty(true); }} className="min-h-[332px] w-full p-4 font-mono text-[12px] outline-none" /> : <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) inlineUpload(file); }}><EditorContent editor={editor} /></div>}</div>{field('excerpt', 'Excerpt / summary', true, 20, 320)}{field('metaDescription', 'SEO meta description', true, 50, 320)}</div><aside className="grid content-start gap-4">{field('category', 'Category', true, 2, 60)}{field('primaryKeyword', 'Primary keyword', true, 2, 100)}{field('tags', 'Tags (comma separated)')}{field('metaTitle', 'SEO title', true, 2, 160)}<label className="grid gap-1 text-[12px] font-semibold">Author<select required value={String(form.authorId || '')} onChange={(event) => { const author = authors.find((item) => item.id === event.target.value); change('authorId', event.target.value || null); if (author) change('authorName', author.name || author.email || 'Admin'); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 text-[13px] font-normal"><option value="">Select admin</option>{authors.map((author) => <option key={author.id} value={author.id}>{author.name || author.email}</option>)}</select></label><label className="grid gap-1 text-[12px] font-semibold">Status<select value={form.status} onChange={(event) => { change('status', event.target.value); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 text-[13px] font-normal"><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PUBLISHED">Published</option></select></label>{form.status === 'SCHEDULED' && <label className="grid gap-1 text-[12px] font-semibold">Publish at<input required type="datetime-local" value={String(form.scheduledAt || '')} onChange={(event) => { change('scheduledAt', event.target.value); setDirty(true); }} className="h-9 border border-[#d9d9dc] bg-white px-2 py-2 text-[12px] font-normal" /></label>}<label className="grid gap-1 text-[12px] font-semibold">Featured image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0]).then((url) => url && change('featuredImage', url))} className="text-[12px] font-normal" />{form.featuredImage && <div className="mt-2 flex items-center gap-2"><img src={form.featuredImage} alt={String(form.imageAltText || '')} className="aspect-video min-w-0 flex-1 object-cover" /><button type="button" disabled={busy} onClick={() => removeUploadedImage(form.featuredImage!)} className="inline-flex shrink-0 items-center gap-1 border border-[#d9d9dc] px-2 py-1 text-[11px] font-semibold text-[#9f3d3d]"><Trash2 size={13} /> Remove</button></div>}</label>{field('imageAltText', 'Featured image alt text')}</aside></div>}
    {dirty && <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between border border-[#b9d5c5] bg-[#f1f8f3] p-3"><span className="text-[12px] font-semibold">Unsaved changes</span><button type="button" onClick={cancel} className="inline-flex items-center gap-2 border border-[#d9d9dc] bg-white px-3 py-2 text-[12px] font-semibold"><X size={14} /> Discard</button></div>}
  </form>;
}
