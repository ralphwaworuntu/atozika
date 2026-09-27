import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiGet, apiPatch, getApiErrorMessage } from '@/lib/api';
import { getAssetUrl } from '@/lib/media';
import { digitsOnly } from '@/lib/phone';
import { useAuth } from '@/hooks/useAuth';
import { parseNameInitials } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

const TARGETS = ['Akpol', 'Akmil', 'Bintara', 'Tamtama', 'Kedinasan'] as const;
const EYE_CONDITIONS = ['Normal', 'Minus', 'Plus', 'Silinder', 'Buta Warna'] as const;
const INCOMES = ['Di bawah Rp2 juta', 'Rp2–5 juta', 'Rp5–10 juta', 'Di atas Rp10 juta'] as const;
const GRADES = ['10', '11', '12'] as const;

type MemberProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  nationalId?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  schoolName?: string | null;
  schoolGrade?: string | null;
  parentName?: string | null;
  parentOccupation?: string | null;
  parentIncome?: string | null;
  parentPhone?: string | null;
  primaryTarget?: string | null;
  backupTarget?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  surgeryHistory?: string | null;
  eyeCondition?: string | null;
  fullBodyUrl?: string | null;
};

type Section = 'self' | 'parent' | 'qualify';

type Draft = {
  name: string;
  nationalId: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  schoolName: string;
  schoolGrade: string;
  phone: string;
  parentName: string;
  parentOccupation: string;
  parentIncome: string;
  parentPhone: string;
  primaryTarget: string;
  backupTarget: string;
  heightCm: string;
  weightKg: string;
  surgeryHistory: string;
  eyeCondition: string;
};

const emptyDraft = (): Draft => ({
  name: '',
  nationalId: '',
  birthPlace: '',
  birthDate: '',
  gender: '',
  schoolName: '',
  schoolGrade: '',
  phone: '',
  parentName: '',
  parentOccupation: '',
  parentIncome: '',
  parentPhone: '',
  primaryTarget: '',
  backupTarget: '',
  heightCm: '',
  weightKg: '',
  surgeryHistory: '',
  eyeCondition: '',
});

function dateInputValue(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function draftFromProfile(profile: MemberProfile): Draft {
  return {
    name: profile.name ?? '',
    nationalId: profile.nationalId ?? '',
    birthPlace: profile.birthPlace ?? '',
    birthDate: dateInputValue(profile.birthDate),
    gender: profile.gender ?? '',
    schoolName: profile.schoolName ?? '',
    schoolGrade: profile.schoolGrade ?? '',
    phone: profile.phone ?? '',
    parentName: profile.parentName ?? '',
    parentOccupation: profile.parentOccupation ?? '',
    parentIncome: profile.parentIncome ?? '',
    parentPhone: profile.parentPhone ?? '',
    primaryTarget: profile.primaryTarget ?? '',
    backupTarget: profile.backupTarget ?? '',
    heightCm: profile.heightCm ? String(profile.heightCm) : '',
    weightKg: profile.weightKg ? String(profile.weightKg) : '',
    surgeryHistory: profile.surgeryHistory ?? '',
    eyeCondition: profile.eyeCondition ?? '',
  };
}

function filled(value?: string | null, min = 1) {
  return Boolean(value && value.trim().length >= min);
}

function validPhone(value?: string | null) {
  const digits = digitsOnly(value ?? '');
  return digits.length >= 10 && digits.length <= 15;
}

function genderLabel(value?: string | null) {
  if (value === 'L') return 'Laki-laki';
  if (value === 'P') return 'Perempuan';
  return 'Belum diisi';
}

function formatBirth(value?: string | null) {
  const raw = dateInputValue(value);
  if (!raw) return 'Belum diisi';
  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return 'Belum diisi';
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', { dateStyle: 'long' });
}

function show(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'Belum diisi';
  return String(value);
}

export function MemberProfilePage() {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['member-profile'],
    queryFn: () => apiGet<MemberProfile>('/auth/me'),
  });

  const profile = profileQuery.data;
  const [editing, setEditing] = useState<Section | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    if (!profile) return;
    setDraft(draftFromProfile(profile));
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPatch<MemberProfile>('/auth/me', body),
    onSuccess: (saved) => {
      queryClient.setQueryData(['member-profile'], saved);
      updateUser({ name: saved.name, phone: saved.phone, avatarUrl: saved.avatarUrl });
      setEditing(null);
      toast.success('Profil berhasil disimpan');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal menyimpan profil')),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append('avatar', file);
      return api.post('/auth/avatar', data);
    },
    onSuccess: (payload) => {
      const avatarUrl = payload.data?.data?.avatarUrl as string | undefined;
      updateUser({ avatarUrl });
      queryClient.setQueryData(['member-profile'], (current: MemberProfile | undefined) =>
        current ? { ...current, avatarUrl } : current,
      );
      toast.success('Foto profil diperbarui');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal mengunggah foto')),
  });

  const fullBodyMutation = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append('photo', file);
      return api.post('/auth/full-body', data);
    },
    onSuccess: (payload) => {
      const fullBodyUrl = payload.data?.data?.fullBodyUrl as string | undefined;
      queryClient.setQueryData(['member-profile'], (current: MemberProfile | undefined) =>
        current ? { ...current, fullBodyUrl } : current,
      );
      toast.success('Foto full body diperbarui');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal mengunggah foto full body')),
  });

  const steps = useMemo(() => {
    const selfDone = Boolean(
      filled(profile?.name, 3) &&
        digitsOnly(profile?.nationalId ?? '').length === 16 &&
        filled(profile?.birthPlace, 2) &&
        dateInputValue(profile?.birthDate) &&
        (profile?.gender === 'L' || profile?.gender === 'P') &&
        filled(profile?.schoolName, 2) &&
        GRADES.includes((profile?.schoolGrade ?? '') as (typeof GRADES)[number]) &&
        validPhone(profile?.phone),
    );
    const parentDone = Boolean(
      filled(profile?.parentName, 3) &&
        filled(profile?.parentOccupation, 2) &&
        INCOMES.includes((profile?.parentIncome ?? '') as (typeof INCOMES)[number]) &&
        validPhone(profile?.parentPhone),
    );
    const qualifyDone = Boolean(
      TARGETS.includes((profile?.primaryTarget ?? '') as (typeof TARGETS)[number]) &&
        TARGETS.includes((profile?.backupTarget ?? '') as (typeof TARGETS)[number]) &&
        profile?.primaryTarget !== profile?.backupTarget &&
        (profile?.heightCm ?? 0) >= 100 &&
        (profile?.weightKg ?? 0) >= 30 &&
        filled(profile?.surgeryHistory, 2) &&
        EYE_CONDITIONS.includes((profile?.eyeCondition ?? '') as (typeof EYE_CONDITIONS)[number]),
    );
    const items = [
      { label: 'Foto diri', weight: 10, done: Boolean(profile?.avatarUrl) },
      { label: 'Foto full body', weight: 10, done: Boolean(profile?.fullBodyUrl) },
      { label: 'Biodata diri', weight: 30, done: selfDone },
      { label: 'Orang tua', weight: 25, done: parentDone },
      { label: 'Kualifikasi', weight: 25, done: qualifyDone },
    ];
    const percent = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
    return { items, percent };
  }, [profile]);

  const setField = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const cancel = () => {
    if (profile) setDraft(draftFromProfile(profile));
    setEditing(null);
  };

  if (profileQuery.isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="member-card p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Edit Profil</h1>
        <p className="mt-2 text-sm text-slate-500">Profil tidak bisa dimuat. Coba lagi sebentar.</p>
        <button
          type="button"
          onClick={() => profileQuery.refetch()}
          className="mt-4 rounded-xl bg-member-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Muat ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-ink-50">Profil Siswa</h1>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <section className="member-card min-w-0 flex-1 p-6">
            <div className="flex h-full items-center gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-400 text-lg font-bold text-amber-950 ring-4 ring-amber-100">
                {profile.avatarUrl ? (
                  <img src={getAssetUrl(profile.avatarUrl)} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  parseNameInitials(profile.name)
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900 dark:text-ink-50">
                  {avatarMutation.isPending ? 'Mengunggah...' : 'Unggah foto baru'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) avatarMutation.mutate(file);
                      event.target.value = '';
                    }}
                  />
                </label>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Foto diri dihitung di kelengkapan profil.
                  <br />
                  JPG, PNG, atau WEBP, maksimal 10 MB.
                </p>
              </div>
            </div>
          </section>

          {steps.percent < 100 ? (
            <div className="member-card flex w-full shrink-0 items-center gap-3 p-4 sm:w-64">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#10b981 0% ${steps.percent}%, #e5e7eb ${steps.percent}% 100%)`,
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-ink-800">
                  <span className="text-[11px] font-extrabold tracking-tight text-slate-900 dark:text-ink-50">{steps.percent}%</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 text-[11px] font-bold tracking-tight text-slate-900 dark:text-ink-50">Lengkapi profilmu</h2>
                <ul className="space-y-0.5">
                  {steps.items.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {item.done ? (
                          <Check className="h-3 w-3 shrink-0 text-slate-800 dark:text-ink-50" strokeWidth={2.5} />
                        ) : (
                          <X className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2.2} />
                        )}
                        <span className={cn('truncate text-[11px] font-medium', item.done ? 'text-slate-700 dark:text-ink-100' : 'text-slate-500')}>
                          {item.label}
                        </span>
                      </span>
                      <span className={cn('shrink-0 text-[10px]', item.done ? 'text-slate-400' : 'font-semibold text-emerald-600')}>
                        {item.done ? `${item.weight}%` : `+${item.weight}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        <section className="member-card p-6">
          <CardHead title="Biodata diri" editing={editing === 'self'} onEdit={() => setEditing('self')} onCancel={cancel} />
          {editing === 'self' ? (
            <form
              className="grid gap-3 pt-2 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate({
                  name: draft.name.trim(),
                  nationalId: digitsOnly(draft.nationalId),
                  birthPlace: draft.birthPlace.trim(),
                  birthDate: draft.birthDate,
                  gender: draft.gender,
                  schoolName: draft.schoolName.trim(),
                  schoolGrade: draft.schoolGrade,
                  phone: digitsOnly(draft.phone),
                });
              }}
            >
              <Field label="Nama lengkap" value={draft.name} onChange={(value) => setField('name', value)} />
              <Field
                label="NIK (16 digit)"
                value={draft.nationalId}
                inputMode="numeric"
                maxLength={16}
                onChange={(value) => setField('nationalId', digitsOnly(value).slice(0, 16))}
              />
              <Field label="Tempat lahir" value={draft.birthPlace} onChange={(value) => setField('birthPlace', value)} />
              <Field label="Tanggal lahir" type="date" value={draft.birthDate} onChange={(value) => setField('birthDate', value)} />
              <SelectField
                label="Jenis kelamin"
                value={draft.gender}
                onChange={(value) => setField('gender', value)}
                options={[
                  { value: 'L', label: 'Laki-laki' },
                  { value: 'P', label: 'Perempuan' },
                ]}
              />
              <SelectField
                label="Kelas"
                value={draft.schoolGrade}
                onChange={(value) => setField('schoolGrade', value)}
                options={GRADES.map((grade) => ({ value: grade, label: `Kelas ${grade}` }))}
              />
              <Field label="Asal sekolah" value={draft.schoolName} onChange={(value) => setField('schoolName', value)} className="md:col-span-2" />
              <Field
                label="No. WhatsApp siswa"
                value={draft.phone}
                inputMode="numeric"
                onChange={(value) => setField('phone', digitsOnly(value))}
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <SaveButton pending={saveMutation.isPending} />
              </div>
            </form>
          ) : (
            <div className="grid gap-6 pt-2 md:grid-cols-2">
              <Info label="Nama lengkap" value={show(profile.name)} />
              <Info label="NIK (16 digit)" value={show(profile.nationalId)} />
              <Info label="Tempat lahir" value={show(profile.birthPlace)} />
              <Info label="Tanggal lahir" value={formatBirth(profile.birthDate)} />
              <Info label="Jenis kelamin" value={genderLabel(profile.gender)} />
              <Info label="Kelas" value={profile.schoolGrade ? `Kelas ${profile.schoolGrade}` : 'Belum diisi'} />
              <Info label="Asal sekolah" value={show(profile.schoolName)} />
              <Info label="No. WhatsApp siswa" value={show(profile.phone)} />
            </div>
          )}
        </section>

        <section className="member-card p-6">
          <CardHead title="Orang tua / wali" editing={editing === 'parent'} onEdit={() => setEditing('parent')} onCancel={cancel} />
          {editing === 'parent' ? (
            <form
              className="grid gap-3 pt-2 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate({
                  parentName: draft.parentName.trim(),
                  parentOccupation: draft.parentOccupation.trim(),
                  parentIncome: draft.parentIncome,
                  parentPhone: digitsOnly(draft.parentPhone),
                });
              }}
            >
              <Field label="Nama orang tua/wali" value={draft.parentName} onChange={(value) => setField('parentName', value)} />
              <Field label="Pekerjaan ortu" value={draft.parentOccupation} onChange={(value) => setField('parentOccupation', value)} />
              <SelectField
                label="Estimasi penghasilan"
                value={draft.parentIncome}
                onChange={(value) => setField('parentIncome', value)}
                options={INCOMES.map((item) => ({ value: item, label: item }))}
              />
              <Field
                label="No. WA orang tua/wali"
                value={draft.parentPhone}
                inputMode="numeric"
                onChange={(value) => setField('parentPhone', digitsOnly(value))}
              />
              <div className="md:col-span-2">
                <SaveButton pending={saveMutation.isPending} />
              </div>
            </form>
          ) : (
            <div className="grid gap-6 pt-2 md:grid-cols-2">
              <Info label="Nama orang tua/wali" value={show(profile.parentName)} />
              <Info label="Pekerjaan ortu" value={show(profile.parentOccupation)} />
              <Info label="Estimasi penghasilan" value={show(profile.parentIncome)} />
              <Info label="No. WA orang tua/wali" value={show(profile.parentPhone)} />
            </div>
          )}
        </section>

        <section className="member-card p-6">
          <CardHead title="Kualifikasi" editing={editing === 'qualify'} onEdit={() => setEditing('qualify')} onCancel={cancel} />
          {editing === 'qualify' ? (
            <form
              className="grid gap-3 pt-2 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate({
                  primaryTarget: draft.primaryTarget,
                  backupTarget: draft.backupTarget,
                  heightCm: Number(draft.heightCm),
                  weightKg: Number(draft.weightKg),
                  surgeryHistory: draft.surgeryHistory.trim(),
                  eyeCondition: draft.eyeCondition,
                });
              }}
            >
              <SelectField
                label="Target utama"
                value={draft.primaryTarget}
                onChange={(value) => setField('primaryTarget', value)}
                options={TARGETS.map((item) => ({ value: item, label: item }))}
              />
              <SelectField
                label="Target cadangan"
                value={draft.backupTarget}
                onChange={(value) => setField('backupTarget', value)}
                options={TARGETS.map((item) => ({ value: item, label: item }))}
              />
              <Field
                label="Tinggi badan (cm)"
                type="number"
                value={draft.heightCm}
                onChange={(value) => setField('heightCm', value)}
              />
              <Field label="Berat badan (kg)" type="number" value={draft.weightKg} onChange={(value) => setField('weightKg', value)} />
              <SelectField
                label="Kondisi mata"
                value={draft.eyeCondition}
                onChange={(value) => setField('eyeCondition', value)}
                options={EYE_CONDITIONS.map((item) => ({ value: item, label: item }))}
                className="md:col-span-2"
              />
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-400">Riwayat operasi / patah tulang</span>
                <textarea
                  value={draft.surgeryHistory}
                  onChange={(event) => setField('surgeryHistory', event.target.value)}
                  rows={3}
                  placeholder="Tulis riwayatnya, atau Tidak ada"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700 focus:border-member-600 focus:outline-none focus:ring-1 focus:ring-member-600 dark:border-white/10 dark:bg-ink-900 dark:text-ink-50"
                />
              </label>
              <div className="md:col-span-2">
                <SaveButton pending={saveMutation.isPending} />
              </div>
            </form>
          ) : (
            <div className="grid gap-6 pt-2 md:grid-cols-2">
              <Info label="Target utama" value={show(profile.primaryTarget)} />
              <Info label="Target cadangan" value={show(profile.backupTarget)} />
              <Info label="Tinggi badan (cm)" value={show(profile.heightCm)} />
              <Info label="Berat badan (kg)" value={show(profile.weightKg)} />
              <Info label="Kondisi mata" value={show(profile.eyeCondition)} />
              <Info label="Riwayat operasi / patah tulang" value={show(profile.surgeryHistory)} />
            </div>
          )}
        </section>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-4 lg:w-72 lg:self-start">
        <div className="member-card p-6">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight text-slate-900 dark:text-ink-50">Foto full body</h2>
          <div className="mb-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-ink-900">
            {profile.fullBodyUrl ? (
              <img src={getAssetUrl(profile.fullBodyUrl)} alt="Foto full body" className="h-full w-full object-contain" />
            ) : (
              <p className="px-4 text-center text-[11px] leading-relaxed text-slate-400">
                Belum ada foto.
                <br />
                Unggah foto seluruh badan.
              </p>
            )}
          </div>
          <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900 dark:text-ink-50">
            {fullBodyMutation.isPending ? 'Mengunggah...' : 'Unggah foto'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) fullBodyMutation.mutate(file);
                event.target.value = '';
              }}
            />
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Foto full body dihitung di kelengkapan profil.
            <br />
            JPG, PNG, atau WEBP, maksimal 10 MB.
          </p>
        </div>
      </aside>
      </div>
    </div>
  );
}

function CardHead({
  title,
  editing,
  onEdit,
  onCancel,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between pb-3">
      <h2 className="text-[15px] font-bold text-slate-900 dark:text-ink-50">{title}</h2>
      {editing ? (
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-ink-50">
          Batal
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-ink-100"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          Edit
        </button>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <span className="break-all text-[13px] font-semibold text-slate-800 dark:text-ink-50">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  maxLength,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: 'numeric';
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-member-600 focus:outline-none focus:ring-1 focus:ring-member-600 dark:border-white/10 dark:bg-ink-900 dark:text-ink-50"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-member-600 focus:outline-none focus:ring-1 focus:ring-member-600 dark:border-white/10 dark:bg-ink-900 dark:text-ink-50"
      >
        <option value="">Pilih</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-member-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-member-700 disabled:opacity-60"
    >
      {pending ? 'Menyimpan...' : 'Simpan perubahan'}
    </button>
  );
}
