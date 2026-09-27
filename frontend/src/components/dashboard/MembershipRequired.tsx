import { Link } from 'react-router-dom';
import type { MembershipStatus } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format';

type MembershipRequiredProps = {
  status?: MembershipStatus;
};

export function MembershipRequired({ status }: MembershipRequiredProps) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-8 text-brand-900 shadow-sm">
      <p className="type-caption uppercase tracking-command text-brand-600">Membership dibutuhkan</p>
      <h2 className="type-h1 mt-2">Aktifkan paket belajar untuk melanjutkan</h2>
      <p className="type-body mt-2 text-brand-800">
        Fitur ini khusus bagi member yang sudah menyelesaikan pembayaran dan divalidasi admin. Lakukan transfer sesuai petunjuk,
        lalu unggah bukti di halaman konfirmasi pembayaran.
      </p>
      {status?.transactionCode && (
        <p className="mt-4 text-sm">
          Kode transaksi terverifikasi: <span className="font-semibold">{status.transactionCode}</span>
          {status.expiresAt && (
            <span className="ml-2 text-xs text-brand-700">berlaku sampai {formatDate(status.expiresAt)}</span>
          )}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/app/paket-membership">Lihat Paket</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/konfirmasi-pembayaran">Konfirmasi Pembayaran</Link>
        </Button>
      </div>
    </div>
  );
}
