import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

export function AdminLayout() {
  const { pathname, hash } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hash) return;
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return (
    <div className="admin-shell relative flex h-[100dvh] overflow-hidden font-member">
      <AdminSidebar />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
