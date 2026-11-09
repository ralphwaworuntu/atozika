import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { apiGet } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ActivityItem = {
  id: string;
  userId: string;
  kind: string;
  title: string;
  path?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
};

type ActivitySummary = {
  userId: string;
  name: string;
  email: string;
  lastLoginAt?: string | null;
  lastSeenAt?: string | null;
  pageViews: number;
  tryoutStarts: number;
  tryoutDone: number;
  practiceDone: number;
  cermatDone: number;
  materialOpen: number;
};

type ActivityPayload = {
  items: ActivityItem[];
  summaries: ActivitySummary[];
};

const kindLabel: Record<string, string> = {
  LOGIN: 'Login',
  PAGE: 'Halaman',
  TRYOUT_START: 'Mulai tryout',
  TRYOUT_SUBMIT: 'Selesai tryout',
  PRACTICE_SUBMIT: 'Selesai latihan',
  CERMAT: 'Tes kecermatan',
  MATERIAL_OPEN: 'Buka materi',
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function AdminActivityLogsPage() {
  const [userId, setUserId] = useState('');
  const [kind, setKind] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity-logs', userId, kind],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (kind) params.set('kind', kind);
      params.set('limit', '200');
      const qs = params.toString();
      return apiGet<ActivityPayload>(`/admin/activity-logs${qs ? `?${qs}` : ''}`);
    },
  });

  const summaries = data?.summaries ?? [];
  const items = data?.items ?? [];
  const selectedSummary = useMemo(
    () => summaries.find((item) => item.userId === userId) ?? null,
    [summaries, userId],
  );

  return (
    <section className="page-shell space-y-6">
      <PageHeader
        variant="panel"
        eyebrow="Admin"
        title="Log Aktivitas Member"
        description="Pantau login terakhir, halaman yang dibuka, tryout, latihan, kecermatan, dan materi."
      />

      <Card>
        <CardContent className="grid gap-3 p-6 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Member</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            >
              <option value="">Semua member</option>
              {summaries.map((item) => (
                <option key={item.userId} value={item.userId}>
                  {item.name} ({item.email})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Jenis aktivitas</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="">Semua jenis</option>
              {Object.entries(kindLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      {selectedSummary && (
        <Card>
          <CardContent className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Login terakhir</p>
              <p className="mt-1 text-sm font-extrabold">{formatDateTime(selectedSummary.lastLoginAt)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Aktivitas terakhir</p>
              <p className="mt-1 text-sm font-extrabold">{formatDateTime(selectedSummary.lastSeenAt)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Halaman dibuka</p>
              <p className="mt-1 text-sm font-extrabold">{selectedSummary.pageViews}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Tryout selesai</p>
              <p className="mt-1 text-sm font-extrabold">{selectedSummary.tryoutDone}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Mulai tryout</p>
              <p className="mt-1 text-sm font-extrabold">{selectedSummary.tryoutStarts}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Latihan selesai</p>
              <p className="mt-1 text-sm font-extrabold">{selectedSummary.practiceDone}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Kecermatan</p>
              <p className="mt-1 text-sm font-extrabold">{selectedSummary.cermatDone}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Materi dibuka</p>
              <p className="mt-1 text-sm font-extrabold">{selectedSummary.materialOpen}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!userId && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-sm font-extrabold text-slate-800">Ringkasan member</h3>
            {isLoading && <Skeleton className="h-40" />}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Login terakhir</th>
                    <th>Aktivitas terakhir</th>
                    <th>Halaman</th>
                    <th>Tryout</th>
                    <th>Latihan</th>
                    <th>Materi</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((item) => (
                    <tr key={item.userId}>
                      <td>
                        <button type="button" className="text-left font-semibold text-brand-700" onClick={() => setUserId(item.userId)}>
                          {item.name}
                          <span className="block text-xs font-medium text-slate-500">{item.email}</span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap">{formatDateTime(item.lastLoginAt)}</td>
                      <td className="whitespace-nowrap">{formatDateTime(item.lastSeenAt)}</td>
                      <td>{item.pageViews}</td>
                      <td>
                        {item.tryoutDone}/{item.tryoutStarts}
                      </td>
                      <td>{item.practiceDone}</td>
                      <td>{item.materialOpen}</td>
                    </tr>
                  ))}
                  {!isLoading && summaries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        Belum ada data member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-extrabold text-slate-800">Detail log</h3>
          {isLoading && <Skeleton className="h-48" />}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Member</th>
                  <th>Jenis</th>
                  <th>Aktivitas</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                    <td>
                      <span className="font-medium">{item.user?.name ?? '-'}</span>
                      <span className="block text-xs text-slate-500">{item.user?.email}</span>
                    </td>
                    <td>{kindLabel[item.kind] ?? item.kind}</td>
                    <td>{item.title}</td>
                    <td className="text-xs text-slate-500">{item.path ?? '-'}</td>
                  </tr>
                ))}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Belum ada log aktivitas. Log mulai terisi setelah member login atau membuka halaman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
