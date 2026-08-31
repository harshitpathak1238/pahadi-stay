'use client';

import { AdminDashboardView } from './AdminDashboardView';
import { ContentManager } from './ContentManager';
import { BlogManager } from './BlogManager';
import { MediaLibrary } from './MediaLibrary';

export function AdminOperationsWorkspace({ initialView = 'Dashboard' }: { initialView?: string }) {
  if (initialView === 'Blog') return <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-8"><BlogManager /></div>;
  if (initialView === 'Media') return <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-8"><MediaLibrary /></div>;
  return initialView === 'Listings' ? <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-8"><ContentManager /></div> : <AdminDashboardView />;
}
