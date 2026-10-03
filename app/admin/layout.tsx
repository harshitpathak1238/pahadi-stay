import { AdminShell } from '@/components/admin/AdminShell';

// The admin workspace renders its own full-height shell with no public header
// or footer. Previously the root layout detected `/admin` via `x-pathname` and
// bailed out early; that request-scoped check forced every page into dynamic
// rendering. Scoping the chrome here instead keeps public pages prerenderable.
//
// Admin data is user-specific and must never be cached.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}

