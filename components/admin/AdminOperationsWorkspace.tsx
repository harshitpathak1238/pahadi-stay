'use client';

import { AdminDashboardView } from './AdminDashboardView';
import { ContentManager } from './ContentManager';

export function AdminOperationsWorkspace({ initialView = 'Dashboard' }: { initialView?: string }) {
  return initialView === 'Listings' ? <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-8"><ContentManager /></div> : <AdminDashboardView />;
}
