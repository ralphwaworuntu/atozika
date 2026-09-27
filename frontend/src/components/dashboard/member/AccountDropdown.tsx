import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, HelpCircle, LogOut, Moon, Settings, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { getAssetUrl } from '@/lib/media';
import { useThemeStore } from '@/store/theme';
import { parseNameInitials } from '@/utils/format';
import { cn } from '@/utils/cn';

type AccountMenuProps = {
  onOpenSettings: () => void;
};

export function AccountMenu({ onOpenSettings }: AccountMenuProps) {
  const { user, logout } = useAuth();
  const membership = useMembershipStatus();
  const resolved = useResolvedTheme();
  const setMode = useThemeStore((state) => state.setMode);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const dark = resolved === 'dark';
  const isActive = Boolean(membership.data?.isActive);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-member-100 text-xs font-bold text-member-700 ring-2 ring-member-600/20 sm:h-10 sm:w-10"
        aria-label="Menu akun"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user?.avatarUrl ? (
          <img src={getAssetUrl(user.avatarUrl)} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          parseNameInitials(user?.name)
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[20rem] rounded-[26px] border border-slate-100 bg-white p-3 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] dark:border-blue-500/20 dark:bg-ink-800"
        >
      <div className="mb-2 flex items-center gap-3 px-2 py-2">
        <div className="relative h-11 w-11 shrink-0 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 p-[2px]">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xs font-bold text-member-700">
            {user?.avatarUrl ? (
              <img src={getAssetUrl(user.avatarUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              parseNameInitials(user?.name)
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-slate-800 dark:text-ink-50">{user?.name ?? 'Member'}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{user?.email}</p>
        </div>
      </div>

      <Link
        to="/app/paket-membership"
        onClick={close}
        className="mb-2 flex items-center justify-between rounded-[18px] bg-gradient-to-r from-sky-500 via-sky-400 to-amber-300 px-3 py-2.5 text-white shadow-sm transition hover:brightness-105"
      >
        <span className="flex items-center gap-2 text-xs font-bold tracking-tight">
          <Crown className="h-4 w-4 fill-amber-200 text-amber-200" />
          {isActive ? 'Kelola paket' : 'Upgrade profil'}
        </span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-slate-800">PRO</span>
      </Link>

      <nav className="space-y-0.5" aria-label="Menu akun">
        <MenuLink to="/app/profil" icon={UserRound} label="Profil" onClick={close} />
        <button type="button" className={itemClass} onClick={() => { close(); onOpenSettings(); }}>
          <Settings className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
          Pengaturan
        </button>
        <MenuLink to="/hubungi-kami" icon={HelpCircle} label="Pusat bantuan" onClick={close} />
        <div className={cn(itemClass, 'justify-between hover:bg-slate-50 dark:hover:bg-white/5')}>
          <span className="flex items-center gap-3">
            <Moon className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
            Mode gelap
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Mode gelap"
            onClick={() => setMode(dark ? 'light' : 'dark')}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition',
              dark ? 'bg-sky-500' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition',
                dark ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </nav>

      <div className="my-2 border-t border-slate-100 dark:border-white/10" />

      <button
        type="button"
        onClick={() => {
          close();
          logout();
        }}
        className="flex w-full items-center gap-2.5 rounded-2xl bg-rose-50/80 px-3.5 py-2.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-100/90 active:scale-[0.99] dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Keluar
      </button>
        </div>
      ) : null}
    </div>
  );
}

const itemClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-ink-200 dark:hover:bg-white/5 dark:hover:text-ink-50';

function MenuLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link to={to} onClick={onClick} className={itemClass}>
      <Icon className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
      {label}
    </Link>
  );
}
