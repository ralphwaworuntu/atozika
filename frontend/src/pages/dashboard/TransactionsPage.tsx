import { useQuery } from '@tanstack/react-query';
import { API_BASE_ORIGIN, apiGet } from '@/lib/api';
import type { MemberTransaction } from '@/types/exam';
import { formatCurrency, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';

export function TransactionsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['transactions'], queryFn: () => apiGet<MemberTransaction[]>('/commerce/transactions') });

  const formatPackageName = (trx: MemberTransaction) => (trx.type === 'ADDON' ? trx.addon?.name ?? 'Addon' : trx.package.name);

  const renderActivation = (trx: MemberTransaction) => {
    if (trx.activatedAt) {
      return (
        <div className="flex flex-col text-xs">
          <span>Aktif: {formatDate(trx.activatedAt)}</span>
          {trx.expiresAt ? (
            <span>Berakhir: {formatDate(trx.expiresAt)}</span>
          ) : trx.type === 'ADDON' ? (
            <span>Mengikuti masa aktif membership</span>
          ) : null}
        </div>
      );
    }

    if (trx.type === 'ADDON' && trx.status === 'PAID') {
      return <span className="text-xs text-slate-500">Aktif mengikuti membership</span>;
    }

    return <span className="text-xs text-slate-400">Belum aktif</span>;
  };

  return (
    <QueryState isLoading={isLoading || !data} isError={isError} error="Gagal memuat transaksi. Coba muat ulang.">
    <section className="page-shell">
      <PageHeader title="Riwayat Transaksi" />
      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Paket</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktivasi</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(data ?? []).map((trx) => (
              <tr key={trx.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{trx.code}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{formatPackageName(trx)}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{trx.type === 'ADDON' ? 'Addon' : trx.package.category}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{trx.method}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(trx.createdAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      trx.status === 'PAID'
                        ? 'bg-success-50 text-success-600'
                        : trx.status === 'PENDING'
                        ? 'bg-brand-50 text-brand-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {trx.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{renderActivation(trx)}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(trx.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {trx.proofUrl && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`${API_BASE_ORIGIN}${trx.proofUrl}`} target="_blank" rel="noreferrer">
                          Lihat Bukti
                        </a>
                      </Button>
                    )}
                    {trx.status !== 'PAID' && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/app/konfirmasi-pembayaran?code=${trx.code}`}>Konfirmasi</Link>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  Belum ada transaksi.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
    </QueryState>
  );
}
