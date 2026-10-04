import { AdminShell } from '@/components/admin/AdminShell';

// The admin workspace renders its own full-height shell with no public header
// or footer. Previously the root layout detected `/admin` via `x-pathname` and
// bailed out early; that request-scoped check forced every page into dynamic
// rendering. Scoping the chrome here instead keeps public pages prerenderable.
//
// The root layout has to render that chrome unconditionally (it wraps every
// route, and a nested layout cannot remove a parent's markup), so it is hidden
// with CSS keyed off `.admin-scope` below. Deciding it in CSS keeps this
// decision out of the render path: the server sends final HTML, there is no
// flash of public chrome and no hydration mismatch, and public pages stay
// prerenderable.
//
// Admin data is user-specific and must never be cached.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-scope">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}

