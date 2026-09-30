import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock3, Layers3, PauseCircle, ListOrdered } from 'lucide-react';
import { apiGet, apiPut } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminPanel, FormField, FormSection, formSelectClassName } from '@/components/admin/ExamSetFormUi';
import { CERMAT_MODE_LABELS, DEFAULT_CERMAT_CONFIG, type CermatConfig, type CermatMode } from '@/types/cermat';
import { cn } from '@/utils/cn';

type PsikoTryoutConfig = {
  breakSeconds: number;
  cermatMode: CermatMode;
};

type ModeToggleForm = {
  imageEnabled: boolean;
  letterEnabled: boolean;
  numberEnabled: boolean;
};

type CermatModesConfig = {
  imageEnabled: boolean;
  letterEnabled: boolean;
  numberEnabled: boolean;
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function AdminKecermatanPage() {
  const queryClient = useQueryClient();

  const { data: cermatConfig, isLoading: configLoading } = useQuery({
    queryKey: ['admin-cermat-config'],
    queryFn: () => apiGet<CermatConfig>('/admin/exams/cermat-config'),
  });

  const { data: psikoConfig, isLoading: psikoLoading } = useQuery({
    queryKey: ['admin-psiko-tryout-config'],
    queryFn: () => apiGet<PsikoTryoutConfig>('/admin/tryouts/psiko-config'),
  });

  const { data: modesConfig, isLoading: modesLoading } = useQuery({
    queryKey: ['admin-cermat-modes'],
    queryFn: () => apiGet<CermatModesConfig>('/admin/exams/cermat-modes'),
  });

  const cermatForm = useForm<CermatConfig>({
    defaultValues: DEFAULT_CERMAT_CONFIG,
  });

  const psikoForm = useForm<PsikoTryoutConfig>({
    defaultValues: { breakSeconds: 5, cermatMode: 'NUMBER' },
  });

  const modesForm = useForm<ModeToggleForm>({
    defaultValues: { imageEnabled: true, letterEnabled: true, numberEnabled: true },
  });

  const watched = cermatForm.watch();

  const saveCermatConfig = useMutation({
    mutationFn: (values: CermatConfig) =>
      apiPut<CermatConfig>('/admin/exams/cermat-config', {
        questionCount: Math.max(1, Number(values.questionCount) || 1),
        durationSeconds: Math.max(1, Number(values.durationSeconds) || 1),
        totalSessions: Math.max(1, Number(values.totalSessions) || 1),
        breakSeconds: Math.max(0, Number(values.breakSeconds) || 0),
      }),
    onSuccess: (payload) => {
      toast.success('Pengaturan modul kecermatan disimpan');
      cermatForm.reset(payload);
      queryClient.invalidateQueries({ queryKey: ['admin-cermat-config'] });
      queryClient.invalidateQueries({ queryKey: ['cermat-config'] });
    },
    onError: () => toast.error('Gagal menyimpan pengaturan modul kecermatan'),
  });

  const savePsikoConfig = useMutation({
    mutationFn: (values: PsikoTryoutConfig) =>
      apiPut<PsikoTryoutConfig>('/admin/tryouts/psiko-config', {
        breakSeconds: Math.max(0, Number(values.breakSeconds) || 0),
        cermatMode: values.cermatMode,
      }),
    onSuccess: (payload) => {
      toast.success('Pengaturan integrasi PSIKO disimpan');
      psikoForm.reset({
        breakSeconds: Number(payload.breakSeconds) || 5,
        cermatMode: payload.cermatMode || 'NUMBER',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-psiko-tryout-config'] });
    },
    onError: () => toast.error('Gagal menyimpan pengaturan integrasi PSIKO'),
  });

  const saveModesConfig = useMutation({
    mutationFn: (values: ModeToggleForm) => apiPut<CermatModesConfig>('/admin/exams/cermat-modes', values),
    onSuccess: (payload) => {
      toast.success('Varian tes kecermatan disimpan');
      modesForm.reset(payload);
      queryClient.invalidateQueries({ queryKey: ['admin-cermat-modes'] });
      queryClient.invalidateQueries({ queryKey: ['cermat-config'] });
      queryClient.invalidateQueries({ queryKey: ['cermat-modes'] });
    },
    onError: () => toast.error('Gagal menyimpan varian tes kecermatan'),
  });

  useEffect(() => {
    if (cermatConfig) {
      cermatForm.reset({
        questionCount: cermatConfig.questionCount ?? DEFAULT_CERMAT_CONFIG.questionCount,
        durationSeconds: cermatConfig.durationSeconds ?? DEFAULT_CERMAT_CONFIG.durationSeconds,
        totalSessions: cermatConfig.totalSessions ?? DEFAULT_CERMAT_CONFIG.totalSessions,
        breakSeconds: cermatConfig.breakSeconds ?? DEFAULT_CERMAT_CONFIG.breakSeconds,
      });
    }
  }, [cermatConfig, cermatForm]);

  useEffect(() => {
    if (psikoConfig) {
      psikoForm.reset({
        breakSeconds: Number(psikoConfig.breakSeconds) || 5,
        cermatMode: psikoConfig.cermatMode || 'NUMBER',
      });
    }
  }, [psikoConfig, psikoForm]);

  useEffect(() => {
    if (modesConfig) {
      modesForm.reset({
        imageEnabled: modesConfig.imageEnabled !== false,
        letterEnabled: modesConfig.letterEnabled !== false,
        numberEnabled: modesConfig.numberEnabled !== false,
      });
    }
  }, [modesConfig, modesForm]);

  const onSubmitCermat = cermatForm.handleSubmit((values) => saveCermatConfig.mutate(values));
  const onSubmitPsiko = psikoForm.handleSubmit((values) => savePsikoConfig.mutate(values));
  const onSubmitModes = modesForm.handleSubmit((values) => saveModesConfig.mutate(values));

  if (configLoading || psikoLoading || modesLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <section className="page-shell space-y-6">
      <PageHeader
        variant="panel"
        eyebrow="Admin"
        title="Pengaturan Tes Kecermatan"
        description="Atur parameter sesi, jeda antar sesi, varian tes, dan integrasi dengan tryout PSIKO."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListOrdered}
          label="Soal / sesi"
          value={String(watched.questionCount || 0)}
          hint="Jumlah soal dalam satu putaran"
        />
        <StatCard
          icon={Clock3}
          label="Durasi"
          value={`${watched.durationSeconds || 0}s`}
          hint="Batas waktu tiap sesi"
        />
        <StatCard
          icon={Layers3}
          label="Total sesi"
          value={String(watched.totalSessions || 0)}
          hint="Putaran dalam satu paket tes"
        />
        <StatCard
          icon={PauseCircle}
          label="Jeda antar sesi"
          value={`${watched.breakSeconds ?? 0}s`}
          hint="Istirahat sebelum sesi berikutnya"
        />
      </div>

      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-brand-900">Cakupan pengaturan</p>
        <ul className="mt-3 space-y-2 text-xs text-slate-700">
          <li>
            <strong className="text-slate-900">Modul kecermatan</strong> — berlaku di halaman member Tes Kecermatan
            untuk semua mode (gambar, huruf, angka).
          </li>
          <li>
            <strong className="text-slate-900">Varian tes</strong> — aktifkan/nonaktifkan mode yang tampil ke member.
          </li>
          <li>
            <strong className="text-slate-900">Integrasi PSIKO</strong> — jeda sesi tryout POLRI/PSIKO dan mode
            kecermatan lanjutan.
          </li>
          <li>
            Token kuota kecermatan per paket diatur di{' '}
            <Link className="font-semibold text-brand-700 underline" to="/admin/commerce">
              Paket & Transaksi
            </Link>
            . Blokir anti-cheat di{' '}
            <Link className="font-semibold text-brand-700 underline" to="/admin/exam-control">
              Kontrol Ujian
            </Link>
            .
          </li>
        </ul>
      </div>

      <AdminPanel
        step={1}
        title="Modul Tes Kecermatan"
        description="Berlaku untuk halaman Tes Kecermatan member — soal per sesi, durasi, total putaran, dan jeda istirahat."
      >
        <form className="space-y-5" onSubmit={onSubmitCermat}>
          <FormSection step={1} title="Parameter sesi" description="Atur isi dan tempo setiap putaran tes kecermatan.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Jumlah soal per sesi" hint="Minimal 1 soal per putaran.">
                <Input type="number" min={1} {...cermatForm.register('questionCount', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Durasi (detik)" hint="Waktu pengerjaan per sesi.">
                <Input type="number" min={1} {...cermatForm.register('durationSeconds', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Total sesi" hint="Berapa kali sesi diulang dalam satu tes.">
                <Input type="number" min={1} {...cermatForm.register('totalSessions', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Jeda antar sesi (detik)" hint="0 = tanpa jeda. Disarankan 5 detik.">
                <Input type="number" min={0} {...cermatForm.register('breakSeconds', { valueAsNumber: true })} />
              </FormField>
            </div>
          </FormSection>
          <Button type="submit" disabled={saveCermatConfig.isPending}>
            {saveCermatConfig.isPending ? 'Menyimpan...' : 'Simpan Modul Kecermatan'}
          </Button>
        </form>
      </AdminPanel>

      <AdminPanel
        step={2}
        title="Varian Tes yang Ditampilkan"
        description="Nonaktifkan mode jika tidak ingin muncul di halaman member."
      >
        <form className="space-y-5" onSubmit={onSubmitModes}>
          <FormSection step={1} title="Mode aktif" description="Minimal satu mode harus aktif.">
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['imageEnabled', 'Gambar Hilang'],
                  ['letterEnabled', 'Huruf Hilang'],
                  ['numberEnabled', 'Angka Hilang'],
                ] as const
              ).map(([name, label]) => (
                <label
                  key={name}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold',
                    modesForm.watch(name) ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...modesForm.register(name)} />
                  {label}
                </label>
              ))}
            </div>
          </FormSection>
          <Button type="submit" disabled={saveModesConfig.isPending}>
            {saveModesConfig.isPending ? 'Menyimpan...' : 'Simpan Varian Tes'}
          </Button>
        </form>
      </AdminPanel>

      <AdminPanel
        step={3}
        title="Integrasi Tryout PSIKO"
        description="Berlaku setelah member menyelesaikan paket sesi tryout POLRI / PSIKO — jeda antar sesi dan lanjutan kecermatan."
        meta="Hanya relevan untuk kategori POLRI dengan sub kategori PSIKO"
      >
        <form className="space-y-5" onSubmit={onSubmitPsiko}>
          <FormSection step={1} title="Alur sesi PSIKO" description="Pengaturan jeda dan tes kecermatan lanjutan.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Jeda antar sesi tryout (detik)" hint="Istirahat antara sesi 1, 2, 3, dst.">
                <Input type="number" min={0} max={300} {...psikoForm.register('breakSeconds', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Tes kecermatan lanjutan" hint="Mode soal setelah paket PSIKO selesai.">
                <select className={formSelectClassName} {...psikoForm.register('cermatMode')}>
                  {(Object.keys(CERMAT_MODE_LABELS) as CermatMode[]).map((mode) => (
                    <option key={mode} value={mode}>
                      {CERMAT_MODE_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </FormSection>
          <Button type="submit" disabled={savePsikoConfig.isPending}>
            {savePsikoConfig.isPending ? 'Menyimpan...' : 'Simpan Integrasi PSIKO'}
          </Button>
        </form>
      </AdminPanel>
    </section>
  );
}
