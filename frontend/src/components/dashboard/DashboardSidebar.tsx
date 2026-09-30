import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Calculator,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
  Package,
  Receipt,
  ScanLine,
  Settings,
  Users,
} from 'lucide-react';
import { dashboardMenu, isDashboardPathActive } from '@/constants/navigation';
import { SidebarToggleButton } from '@/components/dashboard/SidebarToggleButton';
import { AtozikaMascot } from '@/components/dashboard/member/AtozikaMascot';
import { AccountSettingsModal } from '@/components/dashboard/AccountSettingsModal';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useExamControlStatus } from '@/hooks/useExamControl';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { useSidebarStore } from '@/store/sidebar';
import { parseNameInitials } from '@/utils/format';
import { getAssetUrl } from '@/lib/media';

const menuIcons: Record<string, LucideIcon> = {
  '/app': LayoutDashboard,
  '/app/pengumuman': Megaphone,
  '/app/berita': Newspaper,
  '/app/kalkulator': Calculator,
  '/app/latihan/tryout': ClipboardList,
  '/app/latihan-soal': BookOpen,
  '/app/tes-kecermatan': Eye,
  '/app/latihan/tryout/riwayat': History,
  '/app/latihan-soal/riwayat': FileText,
  '/app/tes-kecermatan/riwayat': ScanLine,
  '/app/materi': FolderOpen,
  '/app/paket-membership': Package,
  '/app/konfirmasi-pembayaran': CreditCard,
  '/app/riwayat-transaksi': Receipt,
  '/app/afiliasi': Users,
  '/app/ujian/tryout': GraduationCap,
  '/app/ujian/tryout/riwayat': History,
  '/app/ujian/soal': BookOpen,
  '/app/ujian/soal/riwayat': FileText,
};

type SidebarNavLinkProps = {
  to: string;
  label: string;
  end?: boolean;
  onNavigate?: () => void;
};

function SidebarNavLink({ to, label, end, onNavigate }: SidebarNavLinkProps) {
  const { pathname } = useLocation();
  const active = isDashboardPathActive(pathname, to, end);
  const Icon = menuIcons[to] ?? LayoutDashboard;

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3.5 rounded-2xl px-4 py-2.5 text-sm transition',
        active
          ? 'bg-blue-100/70 font-bold text-member-600 dark:bg-blue-500/20 dark:text-blue-300'
          : 'font-semibold text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-ink-50',
      )}
    >
      <Icon className="h-5 w-5 shrink-0 stroke-[2]" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

type DashboardSidebarPanelProps = {
  onNavigate?: () => void;
  showDesktopToggle?: boolean;
  onToggleDesktop?: () => void;
  onToggleMobile?: () => void;
  showMobileToggle?: boolean;
};

export function DashboardSidebarPanel({
  onNavigate,
  showDesktopToggle = false,
  onToggleDesktop,
  onToggleMobile,
  showMobileToggle = false,
}: DashboardSidebarPanelProps) {
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const examStatusQuery = useExamControlStatus();
  const membership = useMembershipStatus();
  const examEnabled = examStatusQuery.data?.enabled && examStatusQuery.data?.allowed;
  const restrictFeatures = Boolean(membership.data?.isActive);
  const allowTryout = membership.data?.allowTryout !== false;
  const allowPractice = membership.data?.allowPractice !== false;
  const allowCermat = membership.data?.allowCermat !== false;
  const showCermatOnly = restrictFeatures && allowCermat && !allowTryout && !allowPractice;
  const isActive = Boolean(membership.data?.isActive);
  const packageName = membership.data?.packageName ?? 'Member';

  const examSection = [
    { label: 'Tryout', to: '/app/ujian/tryout' },
    { label: 'Riwayat Tryout', to: '/app/ujian/tryout/riwayat' },
    { label: 'Ujian Soal', to: '/app/ujian/soal' },
    { label: 'Riwayat Ujian', to: '/app/ujian/soal/riwayat' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0 px-3 pb-2 pt-4">
        <div className="flex items-center justify-center">
          <AtozikaMascot size="lg" />
          <span className="sr-only">ATOZIKA</span>
        </div>
        {showDesktopToggle && onToggleDesktop ? (
          <SidebarToggleButton
            onClick={onToggleDesktop}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 border-blue-200 bg-white text-member-600 shadow-member hover:border-member-400 hover:bg-member-50 lg:inline-flex"
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
        {dashboardMenu.map((section) => {
          let items = section.items;
          if (section.title === 'Latihan' && showCermatOnly) {
            return null;
          }
          if (restrictFeatures && section.title === 'Latihan') {
            items = items.filter((item) => {
              if (item.label.includes('Tryout')) return allowTryout;
              if (item.label.includes('Latihan Soal')) return allowPractice;
              if (item.label.includes('Tes Kecermatan')) return allowCermat;
              return true;
            });
          }
          if (restrictFeatures && section.title === 'Riwayat') {
            items = items.filter((item) => {
              if (item.label.includes('Tryout')) return allowTryout;
              if (item.label.includes('Latihan')) return allowPractice;
              if (item.label.includes('Kecermatan')) return allowCermat;
              return true;
            });
          }
          if (items.length === 0) {
            return null;
          }

          return (
            <SidebarSection key={section.title} title={section.title}>
              {items.map((item) => (
                <SidebarNavLink key={item.to} to={item.to} label={item.label} end={item.exact} onNavigate={onNavigate} />
              ))}
              {section.title === 'Latihan' && examEnabled && (allowTryout || allowPractice) && (
                <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-blue-500/15">
                  <p className="mb-1.5 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Ujian</p>
                  <div className="space-y-1">
                    {examSection.map((item) => (
                      <SidebarNavLink key={item.to} to={item.to} label={item.label} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              )}
            </SidebarSection>
          );
        })}

        {showCermatOnly && (
          <SidebarSection title="Tes Kecermatan">
            <SidebarNavLink to="/app/tes-kecermatan" label="Tes Kecermatan" onNavigate={onNavigate} />
            <SidebarNavLink to="/app/tes-kecermatan/riwayat" label="Riwayat Kecermatan" onNavigate={onNavigate} />
          </SidebarSection>
        )}
      </nav>

      <div className="shrink-0 space-y-4 px-4 pb-4 pt-2">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-b from-[#E7F2FF] to-[#D9EAFF] p-4 shadow-sm dark:from-blue-500/15 dark:to-blue-900/20 dark:border-blue-500/20">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/20 text-sm">👑</span>
            <span className="text-sm font-bold text-blue-950 dark:text-blue-100">ATOZIKA PRO</span>
          </div>
          <p className="mb-3 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            {isActive
              ? `Paket aktif: ${packageName}`
              : 'Buka semua tryout, materi, dan laporan orang tua.'}
          </p>
          <Link
            to="/app/paket-membership"
            onClick={onNavigate}
            className="flex w-full items-center justify-center rounded-xl bg-member-600 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-member-700 active:scale-[0.98]"
          >
            {isActive ? 'Kelola Paket' : 'Upgrade'}
          </Link>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/80 px-1 pt-3 dark:border-blue-500/15">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-amber-100 ring-2 ring-blue-500/30">
              {user?.avatarUrl ? (
                <img src={getAssetUrl(user.avatarUrl)} alt={user?.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-amber-800">
                  {parseNameInitials(user?.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-xs font-bold leading-tight text-slate-900 dark:text-ink-50">{user?.name}</h4>
              <p className="truncate text-[10px] font-medium text-slate-400">
                {isActive ? packageName : 'Belum aktif'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-white/10"
              aria-label="Pengaturan"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-white/10"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <AccountSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

export function DashboardSidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const toggle = useSidebarStore((state) => state.toggle);
  const toggleMobile = useSidebarStore((state) => state.toggleMobile);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

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
          isOpen ? 'w-[15.5rem]' : 'w-0 overflow-hidden border-r-0',
        )}
      >
        <div className="flex h-full min-h-0 min-w-[15.5rem] flex-col">
          <DashboardSidebarPanel showDesktopToggle onToggleDesktop={toggle} />
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
              <DashboardSidebarPanel
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
