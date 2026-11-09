import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { MemberBottomNav } from '@/components/dashboard/member/MemberBottomNav';
import { WelcomeModal } from '@/components/dashboard/WelcomeModal';

type MemberBackgroundConfig = {
  enabled: boolean;
  imageUrl?: string | null;
};

export function DashboardLayout() {
  const { pathname, hash } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { data: background } = useQuery({
    queryKey: ['member-background'],
    queryFn: () => apiGet<MemberBackgroundConfig>('/dashboard/member-background'),
  });
  const backgroundUrl = background?.enabled && background.imageUrl ? getAssetUrl(background.imageUrl) : '';
  const backgroundStyle = backgroundUrl
    ? {
        backgroundImage: `linear-gradient(rgba(244, 247, 252, 0.88), rgba(244, 247, 252, 0.92)), url('${backgroundUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : undefined;

  useEffect(() => {
    if (hash) return;
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  useEffect(() => {
    if (!pathname.startsWith('/app')) return;
    const title = document.title || pathname;
    const timer = window.setTimeout(() => {
      void apiPost('/auth/activity', { path: pathname, title }).catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="member-shell flex h-[100dvh] overflow-hidden font-member" style={backgroundStyle}>
      <DashboardSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardTopbar />
        <WelcomeModal />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-5 lg:px-6 lg:pb-6">
          <div className="mx-auto w-full max-w-6xl min-w-0 xl:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
      <MemberBottomNav />
    </div>
  );
}
