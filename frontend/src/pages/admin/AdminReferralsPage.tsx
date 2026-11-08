import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/utils/format';

type ReferralRow = {
  id: string;
  status: string;
  createdAt: string;
  referrerName: string;
  referrerEmail: string;
  referralCode: string;
  referredName: string;
  referredEmail: string;
};

export function AdminReferralsPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: () => apiGet<ReferralRow[]>('/admin/referrals'),
  });

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      [row.referrerName, row.referrerEmail, row.referralCode, row.referredName, row.referredEmail, row.status]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  if (isError) {
    return <p className="text-sm font-semibold text-rose-600">Gagal memuat afiliasi.</p>;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64" />;
  }

  return (
    <section className="page-shell">
      <PageHeader
        variant="panel"
        eyebrow="Member"
        title="Afiliasi"
        description="Semua kode referral dan member yang bergabung lewat halaman Afiliasi."
        action={
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, email, atau kode"
            className="w-64"
          />
        }
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pengajak</th>
              <th>Kode</th>
              <th>Member baru</th>
              <th>Status</th>
              <th>Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-sm font-semibold text-slate-500">
                  Belum ada data afiliasi.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-bold text-slate-900 dark:text-ink-50">{row.referrerName}</p>
                    <p className="text-xs text-slate-500">{row.referrerEmail}</p>
                  </td>
                  <td className="font-bold tracking-wide">{row.referralCode}</td>
                  <td>
                    <p className="font-bold text-slate-900 dark:text-ink-50">{row.referredName}</p>
                    <p className="text-xs text-slate-500">{row.referredEmail}</p>
                  </td>
                  <td>{row.status}</td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
