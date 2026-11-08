import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';

type AdminOverview = {
  users: number;
  tryouts: number;
  practiceSets: number;
  materials: number;
  transactions: number;
  transactionAmount: number;
  chartSeries: Array<{ label: string; value: number }>;
};

type OverviewMetricKey = Exclude<keyof AdminOverview, 'chartSeries'>;

const overviewCards: Array<{ key: OverviewMetricKey; label: string; to: string; format?: 'currency' }> = [
  { key: 'users', label: 'Total Pengguna', to: '/admin/users' },
  { key: 'tryouts', label: 'Tryout Aktif', to: '/admin/tryouts' },
  { key: 'practiceSets', label: 'Latihan Soal', to: '/admin/practice' },
  { key: 'materials', label: 'Modul & Materi', to: '/admin/materials' },
  { key: 'transactions', label: 'Transaksi', to: '/admin/commerce' },
  { key: 'transactionAmount', label: 'Nilai Transaksi (PAID)', to: '/admin/activation', format: 'currency' },
];

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-overview'], queryFn: () => apiGet<AdminOverview>('/admin/overview') });

  if (isError) {
    return <p className="text-sm font-semibold text-rose-600">Gagal memuat ringkasan admin.</p>;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64" />;
  }

  const chartMax = data.chartSeries.length ? Math.max(...data.chartSeries.map((item) => item.value), 1) : 1;

  return (
    <section className="page-shell">
      <PageHeader
        variant="panel"
        eyebrow="Dashboard"
        title="Ringkasan Sistem"
        description="Setiap angka membuka kontrol yang sama dengan menu di dashboard member."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card) => {
          const value = Number(data[card.key]);
          const formatted = card.format === 'currency'
            ? value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
            : value.toLocaleString('id-ID');
          return (
            <Link key={card.key} to={card.to} className="admin-metric-card block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{formatted}</p>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-extrabold text-slate-800 dark:text-ink-50">Statistik Sistem</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Perbandingan volume data antar modul utama.</p>
          <div className="mt-5 space-y-4">
            {data.chartSeries.map((series) => {
              const width = Math.max((series.value / chartMax) * 100, 5);
              return (
                <div key={series.label}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{series.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-ink-50">{series.value.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
