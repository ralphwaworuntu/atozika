import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { FloatingWhatsapp } from '@/components/sections/FloatingWhatsapp';
import { cn } from '@/utils/cn';

export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="theme-ink min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-fg)]">
      <Navbar />
      <main className={cn('mx-auto max-w-6xl px-4', isHome ? 'pb-10 pt-0' : 'py-10')}>
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsapp />
    </div>
  );
}
