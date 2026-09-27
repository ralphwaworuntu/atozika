import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

export function AdminLayout() {
  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-slate-50 dark:bg-ink-950">
      <AdminSidebar />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
