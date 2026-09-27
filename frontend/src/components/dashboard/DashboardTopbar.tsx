import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, X } from 'lucide-react';
import { AccountSettingsModal } from '@/components/dashboard/AccountSettingsModal';
import { AccountMenu } from '@/components/dashboard/member/AccountDropdown';
import { SidebarToggleButton } from '@/components/dashboard/SidebarToggleButton';
import { AtozikaMascot } from '@/components/dashboard/member/AtozikaMascot';
import { ExpBar } from '@/components/dashboard/member/ExpBar';
import { IndicatorBoard } from '@/components/dashboard/member/IndicatorBoard';
import { lastSevenDays, memberSearchItems } from '@/lib/memberHome';
import { formatDate } from '@/utils/format';
import { apiGet } from '@/lib/api';
import type { DashboardOverview } from '@/types/dashboard';
import { useSidebarStore } from '@/store/sidebar';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function DashboardTopbar() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [indicatorOpen, setIndicatorOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [statusVisible, setStatusVisible] = useState(true);
  const notesRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const sidebarOpen = useSidebarStore((state) => state.isOpen);
  const toggleSidebar = useSidebarStore((state) => state.toggle);
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiGet<DashboardOverview>('/dashboard/overview'),
  });
  const activityDates = overview?.tryoutResults.map((item) => item.startedAt) ?? [];
  const doneThisWeek = lastSevenDays(activityDates).filter((day) => day.done).length;
  const pendingPayments = overview?.summary.pendingPayments ?? 0;
  const announcements = overview?.announcements ?? [];
  const notifications = useMemo(() => {
    const items: Array<{ id: string; title: string; body: string; meta?: string; to: string }> = [];
    if (pendingPayments > 0) {
      items.push({
        id: `payment-${pendingPayments}`,
        title: 'Pembayaran menunggu konfirmasi',
        body: `${pendingPayments} transaksi masih pending.`,
        to: '/app/konfirmasi-pembayaran',
      });
    }
    for (const item of announcements) {
      items.push({
        id: item.id,
        title: item.title,
        body: item.body,
        meta: formatDate(item.publishedAt),
        to: '/app/pengumuman',
      });
    }
    return items;
  }, [announcements, pendingPayments]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('atozika-read-notes');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;

  const markAllRead = () => {
    const next = Array.from(new Set([...readIds, ...notifications.map((item) => item.id)]));
    setReadIds(next);
    localStorage.setItem('atozika-read-notes', JSON.stringify(next));
  };

  useEffect(() => {
    if (!notesOpen) return undefined;
    const onPointer = (event: MouseEvent) => {
      if (!notesRef.current?.contains(event.target as Node)) setNotesOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotesOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [notesOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusVisible(false);
      window.setTimeout(() => {
        setStatusIndex((current) => (current + 1) % 4);
        setStatusVisible(true);
      }, 280);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return memberSearchItems.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const showResults = focused && query.trim().length > 0;

  const goTo = (to: string) => {
    navigate(to);
    setQuery('');
  };

  return (
    <div className="z-20 shrink-0 border-b border-slate-200/70 bg-[#F4F7FC]/90 px-3 py-2.5 backdrop-blur-md dark:border-blue-500/15 dark:bg-[#070b12]/90 sm:px-6 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <SidebarToggleButton
          onClick={toggleSidebar}
          className={cn(
            'hidden border-blue-200 bg-white text-member-600 shadow-member hover:border-member-400 hover:bg-member-50 hover:text-member-700',
            !sidebarOpen && 'lg:inline-flex',
          )}
          ariaLabel="Tampilkan sidebar"
        />

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <AtozikaMascot size="sm" />
        </div>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && matches[0]) goTo(matches[0].to);
            }}
            className="w-full rounded-2xl border-0 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 shadow-member ring-1 ring-slate-200/80 placeholder:text-slate-400 focus:ring-2 focus:ring-member-600 dark:bg-ink-800 dark:text-ink-50 dark:ring-blue-500/20 sm:max-w-xl sm:py-2.5 sm:pl-11 sm:pr-4"
            placeholder="Cari tryout, latihan, materi..."
            type="search"
          />
          {showResults ? (
            <div className="absolute left-0 top-[calc(100%+0.4rem)] z-30 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-memberSoft dark:border-blue-500/20 dark:bg-ink-800">
              {matches.length === 0 ? (
                <p className="px-4 py-3 text-xs font-medium text-slate-400">Tidak ada halaman yang cocok.</p>
              ) : (
                matches.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    className="flex w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-member-50 hover:text-member-700 dark:text-ink-100 dark:hover:bg-blue-500/10"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goTo(item.to)}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setIndicatorOpen(true)}
            className="flex h-10 min-w-[13rem] items-center justify-center text-xs font-bold text-slate-700 dark:text-ink-50"
            title={statusIndex === 0 ? 'Target minggu ini' : ['Level', 'XP', 'Badge Prestasi'][statusIndex - 1]}
          >
            <span
              className={cn(
                'flex items-center gap-0.5 transition duration-300',
                statusVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
              )}
            >
              {statusIndex === 0 ? (
                <>
                  <span className="text-base leading-none">🔥</span>
                  <span>{doneThisWeek} / 7 Hari</span>
                </>
              ) : null}
              {statusIndex === 1 ? <img src="/level/lv-1.svg" alt="Level" className="h-10 w-44 object-contain" /> : null}
              {statusIndex === 2 ? <ExpBar percent={0} className="h-10 w-[13rem]" /> : null}
              {statusIndex === 3 ? (
                <span className="flex items-center gap-1.5">
                  <img src="/badge/badge.svg" alt="Badge Prestasi" className="h-8 w-8 object-contain" />
                  <span className="text-xs font-bold text-slate-700 dark:text-ink-50">Empiror</span>
                </span>
              ) : null}
            </span>
          </button>
          <div ref={notesRef} className="relative">
            <button
              type="button"
              onClick={() => setNotesOpen((current) => !current)}
              className="relative rounded-full p-1 text-slate-600 transition hover:bg-slate-200/50 hover:text-slate-900 dark:text-ink-200"
              aria-label="Notifikasi"
              aria-expanded={notesOpen}
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {unreadCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#070b12]" />
              ) : null}
            </button>
            {notesOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] dark:border-blue-500/20 dark:bg-ink-800">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-ink-50">Notifikasi</p>
                  {unreadCount > 0 ? (
                    <button type="button" onClick={markAllRead} className="text-[11px] font-semibold text-member-600 hover:text-member-700">
                      Tandai sudah dibaca
                    </button>
                  ) : null}
                </div>
                <div className="max-h-[20rem] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs font-medium text-slate-400">Tidak ada notifikasi.</p>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((item) => {
                        const read = readIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setNotesOpen(false);
                              navigate(item.to);
                            }}
                            className={cn(
                              'flex w-full flex-col rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5',
                              read && 'opacity-60',
                            )}
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-ink-50">{item.title}</span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{item.body}</span>
                            {item.meta ? <span className="mt-1 text-[10px] font-semibold text-slate-400">{item.meta}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <ThemeToggle className="rounded-2xl border-slate-200 bg-white text-slate-700 shadow-member hover:border-member-200 hover:bg-member-50 hover:text-member-700" />
          <AccountMenu onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      <AccountSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Dialog.Root open={indicatorOpen} onOpenChange={setIndicatorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(96vw,72rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl [scrollbar-width:none] dark:border-[#1e2c59] dark:bg-[#0a1126] [&::-webkit-scrollbar]:hidden">
            <Dialog.Title className="sr-only">Badge Prestasi</Dialog.Title>
            <Dialog.Description className="sr-only">Target mingguan, level, total XP, dan badge.</Dialog.Description>
            <Dialog.Close className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-[#192652] dark:text-slate-200" aria-label="Tutup">
              <X className="h-4 w-4" />
            </Dialog.Close>
            <IndicatorBoard doneThisWeek={doneThisWeek} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
