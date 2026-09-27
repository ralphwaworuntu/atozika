import { LogOut, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { SidebarToggleButton } from '@/components/dashboard/SidebarToggleButton';
import { BrandMark } from '@/components/common/BrandMark';
import { parseNameInitials } from '@/utils/format';
import { useAdminSidebarStore } from '@/store/adminSidebar';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function AdminTopbar() {
  const { user, logout } = useAuth();
  const sidebarOpen = useAdminSidebarStore((state) => state.isOpen);
  const toggleSidebar = useAdminSidebarStore((state) => state.toggle);
  const toggleMobileSidebar = useAdminSidebarStore((state) => state.toggleMobile);
  const showBrandInTopbar = !sidebarOpen;

  return (
    <div className="chrome-navy relative z-20 shrink-0 border-b border-brand-400/25 bg-navy">
      <div className="relative flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <SidebarToggleButton
            onClick={toggleMobileSidebar}
            tone="navy"
            className="lg:hidden"
            ariaLabel="Buka menu sidebar"
          />
          <SidebarToggleButton
            onClick={toggleSidebar}
            tone="navy"
            className={cn('hidden', !sidebarOpen && 'lg:inline-flex')}
            ariaLabel="Tampilkan sidebar"
          />

          <BrandMark
            size="sm"
            variant="icon"
            framed
            tone="ink"
            className="shrink-0 lg:hidden [&_.brand-logo]:!h-8"
          />

          {showBrandInTopbar ? (
            <BrandMark
              size="sm"
              variant="compact"
              showTagline={false}
              framed
              tone="ink"
              className="hidden min-w-0 shrink-0 lg:flex"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="hidden text-[11px] font-semibold uppercase tracking-command text-brand-400 sm:block">
              Admin Panel
            </p>
            <h1 className="type-h1 truncate text-ink-50 sm:hidden">Admin</h1>
            <h1 className="type-h1 hidden truncate text-ink-50 sm:block">
              Mengelola ATOZIKA
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle tone="navy" />
          <Button
            variant="outline"
            size="sm"
            className="hidden border-brand-400/40 bg-transparent text-ink-50 hover:bg-white/10 hover:text-brand-300 md:inline-flex"
            asChild
          >
            <Link to="/app">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Member Area
            </Link>
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-xs font-bold text-ink-800 sm:h-11 sm:w-11 sm:text-sm">
            {parseNameInitials(user?.name)}
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="hidden text-ink-100 hover:bg-white/10 hover:text-brand-300 lg:inline-flex">
            <LogOut className="mr-2 h-4 w-4" /> Keluar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-9 w-9 text-ink-100 hover:bg-white/10 lg:hidden"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
