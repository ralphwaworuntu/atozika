import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, FolderOpen, LayoutDashboard, Menu } from 'lucide-react';
import { isDashboardPathActive } from '@/constants/navigation';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/store/sidebar';

const items = [
  { label: 'Home', to: '/app', icon: LayoutDashboard, exact: true },
  { label: 'Tryout', to: '/app/latihan/tryout', icon: ClipboardList },
  { label: 'Latihan', to: '/app/latihan-soal', icon: BookOpen },
  { label: 'Materi', to: '/app/materi', icon: FolderOpen },
] as const;

export function MemberBottomNav() {
  const { pathname } = useLocation();
  const toggleMobile = useSidebarStore((state) => state.toggleMobile);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-blue-500/15 dark:bg-[#121a28]/95 lg:hidden"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={isDashboardPathActive(pathname, item.to, item.to === '/app') ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-bold',
                  isDashboardPathActive(pathname, item.to, item.to === '/app')
                    ? 'text-member-600'
                    : 'text-slate-400 hover:text-slate-700',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl',
                    isDashboardPathActive(pathname, item.to, item.to === '/app') && 'bg-blue-100/80 dark:bg-blue-500/20',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={toggleMobile}
            className="flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl">
              <Menu className="h-5 w-5" strokeWidth={2.2} />
            </span>
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
