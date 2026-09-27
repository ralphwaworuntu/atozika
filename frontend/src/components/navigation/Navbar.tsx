import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { publicNavLinks } from '@/constants/navigation';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/common/BrandMark';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [barHeight, setBarHeight] = useState(84);
  const barRef = useRef<HTMLDivElement>(null);
  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return undefined;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;

    const syncHeight = () => setBarHeight(bar.getBoundingClientRect().height);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
        transparent
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-brand-400/15 bg-ink-950/85 backdrop-blur-xl',
      )}
    >
      <div
        ref={barRef}
        className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-3.5"
      >
        <BrandMark href="/" size="md" variant="icon" />

        <nav className="hidden gap-6 text-sm font-medium text-ink-200 md:flex">
          {publicNavLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  'transition-colors hover:text-brand-300',
                  (isActive || pathname === link.href) && 'font-semibold text-brand-400',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button variant="outline" asChild>
              <Link to="/app">Buka Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-ink-100 hover:bg-ink-800 hover:text-brand-300">
                <Link to="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/register">Daftar</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="relative z-50 rounded-xl p-2 text-ink-100 transition hover:bg-ink-800"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink-950/70"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 border-b border-brand-400/15 bg-ink-900 shadow-command">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
              <BrandMark href="/" size="md" variant="icon" />
              <button
                type="button"
                className="rounded-xl p-2 text-ink-100 transition hover:bg-ink-800"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="border-t border-brand-400/15 px-4 pb-5 pt-2">
              <nav className="flex flex-col gap-1 py-2 text-sm font-semibold text-ink-50">
                {publicNavLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-xl px-3 py-3 text-ink-50 hover:bg-ink-800',
                        isActive && 'bg-brand-500/15 text-brand-300',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-2 flex flex-col gap-2">
                <ThemeToggle compact={false} className="w-full justify-center" />
                {isAuthenticated ? (
                  <Button asChild>
                    <Link to="/app" onClick={() => setOpen(false)}>
                      Buka Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link to="/auth/login" onClick={() => setOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth/register" onClick={() => setOpen(false)}>
                        Daftar
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
    <div aria-hidden="true" style={{ height: barHeight }} />
    </>
  );
}
