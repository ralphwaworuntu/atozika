import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  Building2,
  HelpCircle,
  LayoutTemplate,
  Mail,
  Palette,
  PanelsTopLeft,
  Megaphone,
  Newspaper,
  ShieldCheck,
  Trophy,
  UserCog,
  Users,
  BadgeCheck,
} from 'lucide-react';
import { adminMenu } from '@/constants/navigation';
import { AtozikaMascot } from '@/components/dashboard/member/AtozikaMascot';
import { SidebarToggleButton } from '@/components/dashboard/SidebarToggleButton';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSidebarStore } from '@/store/adminSidebar';
import { parseNameInitials } from '@/utils/format';

const menuIcons: Record<string, LucideIcon> = {
  '/admin': LayoutDashboard,
  '/admin/announcements': Megaphone,
  '/admin/news': Newspaper,
  '/admin/calculators': Calculator,
  '/admin/materials': FolderOpen,
  '/admin/tryouts': ClipboardList,
  '/admin/practice': BookOpen,
  '/admin/kecermatan': Eye,
  '/admin/exam-control': ShieldCheck,
  '/admin/word-converter': FileText,
  '/admin/monitoring': History,
  '/admin/reporting': BarChart3,
  '/admin/ranking': Trophy,
  '/admin/commerce': CreditCard,
  '/admin/activation': BadgeCheck,
  '/admin/contacts': Mail,
  '/admin/referrals': Users,
  '/admin/users': UserCog,
  '/admin/system-monitoring': Activity,
  '/admin/landing': LayoutTemplate,
  '/admin/beranda': PanelsTopLeft,
  '/admin/profil': Building2,
  '/admin/faq': HelpCircle,
  '/admin/tampilan': Palette,
};

type AdminSidebarNavLinkProps = {
  to: string;
  label: string;
  end?: boolean;
  onNavigate?: () => void;
};

function AdminSidebarNavLink({ to, label, end, onNavigate }: AdminSidebarNavLinkProps) {
  const Icon = menuIcons[to] ?? LayoutDashboard;

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition',
          isActive
            ? 'bg-blue-100/70 font-bold text-member-600 dark:bg-blue-500/20 dark:text-blue-300'
            : 'font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-ink-50',
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0 stroke-[2]" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function AdminSidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

type AdminSidebarPanelProps = {
  onNavigate?: () => void;
  showDesktopToggle?: boolean;
  onToggleDesktop?: () => void;
  onToggleMobile?: () => void;
  showMobileToggle?: boolean;
};

function AdminSidebarPanel({
  onNavigate,
  showDesktopToggle = false,
  onToggleDesktop,
  onToggleMobile,
  showMobileToggle = false,
}: AdminSidebarPanelProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0 px-3 pb-2 pt-4">
        <div className="flex items-center justify-center">
          <AtozikaMascot size="lg" />
          <span className="sr-only">ATOZIKA Admin</span>
        </div>
        {showDesktopToggle && onToggleDesktop ? (
          <SidebarToggleButton
            onClick={onToggleDesktop}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 border-blue-200 bg-white text-member-600 shadow-sm hover:border-member-400 hover:bg-member-50 lg:inline-flex"
            ariaLabel="Sembunyikan sidebar"
          />
        ) : null}
        {showMobileToggle && onToggleMobile ? (
          <SidebarToggleButton
            onClick={onToggleMobile}
            className="absolute right-3 top-1/2 -translate-y-1/2 border-blue-200 bg-white text-member-600 lg:hidden"
            ariaLabel="Tutup menu"
          />
        ) : null}
      </div>

      <nav className="sidebar-nav no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
        {adminMenu.map((section) => (
          <AdminSidebarSection key={section.title} title={section.title}>
            {section.items.map((item) => (
              <AdminSidebarNavLink key={item.to} to={item.to} label={item.label} end={item.exact} onNavigate={onNavigate} />
            ))}
          </AdminSidebarSection>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200/80 px-4 py-4 dark:border-blue-500/15">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800 ring-2 ring-blue-500/30">
            {parseNameInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900 dark:text-ink-50">{user?.name ?? 'Administrator'}</p>
            <p className="truncate text-[10px] font-medium text-slate-400">{user?.email ?? 'Admin'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const isOpen = useAdminSidebarStore((state) => state.isOpen);
  const isMobileOpen = useAdminSidebarStore((state) => state.isMobileOpen);
  const toggle = useAdminSidebarStore((state) => state.toggle);
  const toggleMobile = useAdminSidebarStore((state) => state.toggleMobile);
  const setMobileOpen = useAdminSidebarStore((state) => state.setMobileOpen);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileOpen]);

  return (
    <>
      <aside
        className={cn(
          'relative z-10 hidden h-full shrink-0 flex-col border-r border-slate-200/70 bg-[#F4F7FC] transition-[width] duration-300 ease-in-out dark:border-blue-500/15 dark:bg-[#070b12] lg:flex',
          isOpen ? 'w-[16.5rem]' : 'w-0 overflow-hidden border-r-0',
        )}
      >
        <div className="flex h-full min-h-0 min-w-[16.5rem] flex-col">
          <AdminSidebarPanel showDesktopToggle onToggleDesktop={toggle} />
        </div>
      </aside>

      {isMobileOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Tutup menu"
              className="fixed inset-0 z-[60] bg-slate-900/50 touch-none lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className="fixed inset-y-0 left-0 z-[70] flex h-[100dvh] max-h-[100dvh] w-[min(18rem,92vw)] flex-col overflow-hidden border-r border-slate-200/70 bg-[#F4F7FC] shadow-xl dark:border-blue-500/15 dark:bg-[#070b12] lg:hidden"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <AdminSidebarPanel
                showMobileToggle
                onToggleMobile={toggleMobile}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
