import { LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarToggleButton } from '@/components/dashboard/SidebarToggleButton';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { adminMenu } from '@/constants/navigation';
import { useAdminSidebarStore } from '@/store/adminSidebar';
import { cn } from '@/utils/cn';

function currentTitle(pathname: string) {
  const items = adminMenu.flatMap((section) => section.items);
  const exact = items.find((item) => item.to === pathname);
  if (exact) return exact.label;
  const nested = items
    .filter((item) => item.to !== '/admin' && pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return nested?.label ?? 'Admin';
}

export function AdminTopbar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const sidebarOpen = useAdminSidebarStore((state) => state.isOpen);
  const toggleSidebar = useAdminSidebarStore((state) => state.toggle);
  const toggleMobileSidebar = useAdminSidebarStore((state) => state.toggleMobile);
  const title = currentTitle(pathname);

  return (
    <div className="z-20 shrink-0 border-b border-slate-200/70 bg-[#F4F7FC]/90 px-3 py-2.5 backdrop-blur-md dark:border-blue-500/15 dark:bg-[#070b12]/90 sm:px-6 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <SidebarToggleButton
          onClick={toggleMobileSidebar}
          className="border-blue-200 bg-white text-member-600 lg:hidden"
          ariaLabel="Buka menu sidebar"
        />
        <SidebarToggleButton
          onClick={toggleSidebar}
          className={cn('hidden border-blue-200 bg-white text-member-600', !sidebarOpen && 'lg:inline-flex')}
          ariaLabel="Tampilkan sidebar"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Panel Admin</p>
          <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{title}</h1>
        </div>
        <ThemeToggle />
        <Link
          to="/app"
          className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-white/10 dark:text-ink-50 dark:ring-white/10 md:inline-flex"
        >
          <LayoutDashboard className="h-4 w-4" />
          Area Member
        </Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </div>
  );
}
