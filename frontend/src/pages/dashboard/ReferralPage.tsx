import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { ReferralOverview } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format';
import { QueryState } from '@/components/common/QueryState';

export function ReferralPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['referrals'], queryFn: () => apiGet<ReferralOverview>('/referrals/me') });

  return (
    <QueryState isLoading={isLoading || !data} isError={isError} error="Gagal memuat data afiliasi. Coba muat ulang.">
      {data ? (
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Kode Referral Anda</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="rounded-2xl bg-slate-900 px-4 py-2 text-lg font-bold text-white">{data.referralCode}</span>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(data.link);
                }}
              >
                Salin Link
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Bagikan link: {data.link}</p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Member Bergabung</p>
            <div className="mt-4 space-y-3">
              {data.list.length === 0 ? <p className="text-sm font-semibold text-slate-400">Belum ada member yang bergabung lewat kode Anda.</p> : null}
              {data.list.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.referred.name}</p>
                  <p className="text-xs text-slate-500">{item.referred.email}</p>
                  <p className="text-xs text-slate-500">Bergabung {formatDate(item.referred.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </QueryState>
  );
}
