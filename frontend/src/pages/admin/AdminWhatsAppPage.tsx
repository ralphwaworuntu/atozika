import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDate } from '@/utils/format';

type DispatchRow = {
  id: string;
  parentPhone: string;
  kind: string;
  body: string;
  status: string;
  detail: string;
  createdAt: string;
  sentAt?: string | null;
};

type WhatsAppStatus = {
  provider: string;
  configured: boolean;
  template: string;
  pending: number;
  items: DispatchRow[];
};

export function AdminWhatsAppPage() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-whatsapp'],
    queryFn: () => apiGet<WhatsAppStatus>('/admin/whatsapp'),
  });
  const retry = useMutation({
    mutationFn: () => apiPost<{ tried: number; sent: number }>('/admin/whatsapp/retry', {}),
    onSuccess: (result) => {
      toast.success(`Antrean diproses: ${result.sent} terkirim dari ${result.tried}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp'] });
    },
    onError: () => toast.error('Antrean belum terkirim. Periksa kredensial WhatsApp.'),
  });
  const test = useMutation({
    mutationFn: () => apiPost<{ sent: boolean }>('/admin/whatsapp/test', { phone }),
    onSuccess: () => {
      toast.success('Pesan uji terkirim.');
      setPhone('');
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp'] });
    },
    onError: () => toast.error('Pesan uji gagal. Nomor atau kredensial belum siap.'),
  });

  if (isError) {
    return <p className="text-sm font-semibold text-rose-600">Gagal memuat status WhatsApp. Coba muat ulang.</p>;
  }
  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  return (
    <section className="page-shell space-y-6">
      <PageHeader
        variant="panel"
        eyebrow="Admin"
        title="WhatsApp Orang Tua"
        description="Rapor tryout, latihan soal, dan tes kecermatan dikirim otomatis ke nomor orang tua di profil member."
      />

      <Card>
        <CardContent className="space-y-3 p-6">
        <p className="text-sm font-extrabold text-slate-900 dark:text-ink-50">
          {data.configured ? 'Kredensial terpasang' : 'Kredensial belum diisi'}
        </p>
        <p className="text-sm text-slate-500 dark:text-ink-200">
          Provider: {data.provider}
          {data.template ? ` · Template: ${data.template}` : ''}
          {' · '}
          Menunggu kirim: {data.pending}
        </p>
        <p className="text-sm text-slate-500 dark:text-ink-200">
          Isi WHATSAPP_PROVIDER, WHATSAPP_TOKEN, dan untuk Meta juga WHATSAPP_PHONE_NUMBER_ID di backend/.env server, lalu muat ulang API.
          Template Meta memakai satu variabel isi pesan. Tanpa template, Meta hanya mengirim dalam jendela 24 jam.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => retry.mutate()} disabled={!data.configured || retry.isPending || data.pending === 0}>
            Kirim antrean tertunda
          </Button>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Nomor uji, contoh 0812..." className="max-w-xs" />
          <Button type="button" variant="outline" onClick={() => test.mutate()} disabled={!data.configured || !phone || test.isPending}>
            Kirim pesan uji
          </Button>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Jenis</th>
              <th>Nomor</th>
              <th>Status</th>
              <th>Pesan</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Belum ada rapor yang diantrekan.
                </td>
              </tr>
            ) : null}
            {data.items.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.sentAt || item.createdAt)}</td>
                <td>{item.kind}</td>
                <td>{item.parentPhone}</td>
                <td>
                  <p className="font-semibold">{item.status}</p>
                  {item.detail ? <p className="text-xs text-slate-500">{item.detail}</p> : null}
                </td>
                <td className="max-w-sm whitespace-pre-line text-xs">{item.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </CardContent>
      </Card>
    </section>
  );
}
