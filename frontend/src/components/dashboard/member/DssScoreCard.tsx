import { useMemo, useState, type MouseEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

type PillarInput = { id: 'akademik' | 'psikotes' | 'jasmani' | 'medis'; label: string; value: number };

type DssProfile = {
  birthDate?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  eyeCondition?: string | null;
};

const WEIGHTS = { akademik: 0.35, psikotes: 0.25, jasmani: 0.25, medis: 0.15 } as const;

const METHODS: Record<PillarInput['id'], string> = {
  akademik: 'TKA, Pengetahuan Umum, TWK, B.Inggris, Math CAT Engine',
  psikotes: 'Kestabilan Emosi, Profile Match, Kecermatan',
  jasmani: 'Lari, Push-up, Sit-up, Pull-up, Renang, Postur',
  medis: 'Tensi, Visus, Gigi, THT, Lab, EKG/USG',
};

type CheckResult = 'PASS' | 'FAIL' | 'BELUM';

function formatStamp(date: Date) {
  const text = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
  return `${text.replace('.', ':')} WIB`;
}

function ageParts(birthDate?: string | null) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months };
}

function constraintRows(profile?: DssProfile) {
  const age = ageParts(profile?.birthDate);
  const agePass: CheckResult = !age
    ? 'BELUM'
    : age.years > 21 || (age.years === 21 && age.months > 0) || age.years < 17 || (age.years === 17 && age.months < 7)
      ? 'FAIL'
      : 'PASS';

  const height = profile?.heightCm ?? 0;
  const minHeight = profile?.gender === 'P' ? 160 : profile?.gender === 'L' ? 165 : 0;
  const heightPass: CheckResult = !height || !minHeight ? 'BELUM' : height >= minHeight ? 'PASS' : 'FAIL';

  const bmi = height > 0 && profile?.weightKg ? profile.weightKg / (height / 100) ** 2 : null;
  const bmiPass: CheckResult = bmi == null ? 'BELUM' : bmi >= 19 && bmi <= 26 ? 'PASS' : 'FAIL';

  const eye = profile?.eyeCondition;
  const eyePass: CheckResult = !eye ? 'BELUM' : eye === 'Buta Warna' ? 'FAIL' : eye === 'Normal' ? 'PASS' : 'BELUM';

  return [
    { name: 'Usia', bintara: '17 Thn 7 Bln s.d. 21 Thn 0 Bln', akpol: 'Maksimal 21 Thn 0 Bln', result: agePass },
    { name: 'Tinggi Badan (TB)', bintara: 'Pria ≥ 165 cm | Wanita ≥ 160 cm', akpol: 'Pria ≥ 165 cm | Wanita ≥ 160 cm', result: heightPass },
    { name: 'Indeks Massa Tubuh (BMI)', bintara: '19.0 ≤ BMI ≤ 26.0', akpol: '19.0 ≤ BMI ≤ 26.0', result: bmiPass },
    { name: 'Visus / Kesehatan Mata', bintara: 'Maksimal minus ringan. Buta warna = TMS', akpol: 'Mata normal. Buta warna = TMS', result: eyePass },
  ];
}

function chanceLabel(value: number) {
  if (value >= 75) return 'Tinggi';
  if (value >= 70) return 'Cukup Tinggi';
  if (value >= 60) return 'Cukup';
  return 'Rendah';
}

export function DssScoreCard({ pillars }: { pillars: PillarInput[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [updatedAt] = useState(() => new Date());
  const profileQuery = useQuery({
    queryKey: ['member-profile'],
    queryFn: () => apiGet<DssProfile>('/auth/me'),
  });

  const model = useMemo(() => {
    const byId = Object.fromEntries(pillars.map((item) => [item.id, item.value])) as Record<PillarInput['id'], number>;
    const score =
      byId.akademik * WEIGHTS.akademik +
      byId.psikotes * WEIGHTS.psikotes +
      byId.jasmani * WEIGHTS.jasmani +
      byId.medis * WEIGHTS.medis;
    const rows = constraintRows(profileQuery.data);
    const hard = rows.some((row) => row.result === 'FAIL')
      ? 'FAIL'
      : rows.every((row) => row.result === 'PASS')
        ? 'PASS'
        : 'BELUM';
    const scenario = hard === 'FAIL' || score < 60 ? 'merah' : hard === 'PASS' && score >= 75 ? 'hijau' : hard === 'PASS' ? 'kuning' : 'proses';
    return { byId, score, rows, hard, scenario };
  }, [pillars, profileQuery.data]);

  const tone =
    model.scenario === 'hijau'
      ? { badge: 'bg-emerald-600', text: 'text-emerald-600', label: 'HIJAU', status: 'SKENARIO HIJAU (MATCH)' }
      : model.scenario === 'kuning'
        ? { badge: 'bg-amber-500', text: 'text-amber-600', label: 'KUNING', status: 'SKENARIO KUNING (WARNING)' }
        : model.scenario === 'proses'
          ? { badge: 'bg-slate-500', text: 'text-slate-600', label: 'PROSES', status: 'MENUNGGU DATA HARD CONSTRAINT' }
          : { badge: 'bg-rose-500', text: 'text-rose-600', label: 'MERAH', status: 'SKENARIO MERAH (AUTO-PIVOT)' };

  const refresh = (event: MouseEvent) => {
    event.stopPropagation();
    void queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['member-profile'] });
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') setOpen(true);
        }}
        className="member-card flex cursor-pointer flex-col gap-4 p-5 text-left transition hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500">DSS SCORE</span>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white', tone.badge)}>
            {tone.label}
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-4xl font-extrabold tracking-tight', tone.text)}>{model.score.toFixed(2)}</span>
            <span className="text-sm font-semibold text-slate-400">/100</span>
          </div>
          <p className={cn('mt-1 text-[11px] font-bold', tone.text)}>Status: {tone.status}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-ink-200">
            Hard Constraints:
            <span className="font-bold text-slate-800 dark:text-ink-50">{model.hard === 'BELUM' ? 'BELUM LENGKAP' : model.hard}</span>
            {model.hard === 'PASS' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
          </p>
        </div>
        <div>
          <div className="relative flex h-2 gap-1">
            <div className="h-2 flex-[60] rounded-l-full bg-rose-500" />
            <div className="h-2 flex-[15] bg-amber-500" />
            <div className="h-2 flex-[25] rounded-r-full bg-emerald-500" />
            <span
              className="absolute -top-1.5 h-5 w-1 rounded-full bg-emerald-800 ring-2 ring-white dark:ring-ink-800"
              style={{ left: `${Math.min(100, Math.max(0, model.score))}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
            <span>0</span>
            <span>60</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-blue-400/80 px-3 py-2 text-[11px] font-semibold text-blue-600">
          <span className="flex-1 text-center">Lihat Detail Penilaian</span>
          <ChevronRight className="h-4 w-4" />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
          <span>Update: {formatStamp(updatedAt)}</span>
          <button type="button" aria-label="Muat ulang" onClick={refresh} className="hover:text-slate-600">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>
      <DssDetailModal
        open={open}
        onOpenChange={setOpen}
        studentId={user?.referralCode ?? user?.id ?? '-'}
        updatedLabel={formatStamp(updatedAt)}
        pillars={pillars}
        model={model}
        tone={tone}
      />
    </>
  );
}

function DssDetailModal({
  open,
  onOpenChange,
  studentId,
  updatedLabel,
  pillars,
  model,
  tone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  updatedLabel: string;
  pillars: PillarInput[];
  model: {
    byId: Record<PillarInput['id'], number>;
    score: number;
    rows: Array<{ name: string; bintara: string; akpol: string; result: CheckResult }>;
    hard: string;
  };
  tone: { text: string; status: string };
}) {
  const pathways = [
    { name: 'TNI', value: Math.round(model.score * 0.92), bar: 'bg-emerald-600', chip: 'bg-emerald-50 text-emerald-600' },
    { name: 'POLRI', value: Math.round(model.score), bar: 'bg-blue-600', chip: 'bg-blue-50 text-blue-600' },
    { name: 'KEDINASAN', value: Math.round(model.score * 0.91), bar: 'bg-purple-600', chip: 'bg-purple-50 text-purple-600' },
    { name: 'BUMN', value: Math.round(model.score * 0.88), bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-600' },
  ];
  const recommendation =
    model.hard === 'PASS' && model.score >= 75
      ? ['Disetujui di Jalur Target Utama.', 'Masuk Fast Track / Reguler / VVIP.']
      : model.hard === 'PASS' && model.score >= 60
        ? ['Diterima dengan intervensi khusus.', 'Diet atau drill intensif.']
        : ['Auto-Pivot ke jalur lain.', 'Kedinasan sipil atau BUMN.'];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(96vw,1100px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:border dark:border-white/10 dark:bg-ink-800">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-800 dark:text-ink-50">Detail Penilaian DSS</Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs font-medium text-slate-500">
                  ID Siswa: <span className="font-semibold text-slate-700 dark:text-ink-100">{studentId}</span> • Update: {updatedLabel}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10" aria-label="Tutup">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="space-y-6 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-slate-500">NILAI AKHIR DSS</p>
                  <p className="mt-1">
                    <span className={cn('text-4xl font-extrabold', tone.text)}>{model.score.toFixed(2)}</span>
                    <span className="ml-1 text-sm font-semibold text-slate-400">/100</span>
                  </p>
                </div>
                <div className="space-y-1 text-xs sm:text-right">
                  <p className="font-medium text-slate-600 dark:text-ink-200">
                    Status: <span className={cn('font-bold', tone.text)}>{tone.status}</span>
                  </p>
                  <p className="font-medium text-slate-600 dark:text-ink-200">Hard Constraints: {model.hard === 'BELUM' ? 'BELUM LENGKAP' : model.hard}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-slate-500">REKOMENDASI SISTEM</p>
                  <p className="mt-1 text-xs font-bold text-slate-800 dark:text-ink-50">{recommendation[0]}</p>
                  <p className="text-xs text-slate-600 dark:text-ink-200">{recommendation[1]}</p>
                </div>
                <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-500" />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-ink-50">Peluang Lolos di Berbagai Jalur</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {pathways.map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 p-3.5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold', item.chip)}>{item.name.slice(0, 2)}</span>
                      <div>
                        <p className="text-[11px] font-bold">{item.name}</p>
                        <p className="text-xl font-extrabold text-slate-800 dark:text-ink-50">{item.value}%</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className={cn('h-full rounded-full', item.bar)} style={{ width: `${item.value}%` }} />
                    </div>
                    <p className="mt-1.5 text-[10px] font-medium text-slate-500">Kategori: {chanceLabel(item.value)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2.5 text-sm font-bold text-slate-800 dark:text-ink-50">1. PEMBOBOTAN KOMPOSIT 4 PILAR</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-ink-200">
                    <tr>
                      <th className="px-4 py-2.5">Pilar</th>
                      <th className="px-4 py-2.5">Bobot</th>
                      <th className="px-4 py-2.5">Skor Anda</th>
                      <th className="px-4 py-2.5">Kontribusi</th>
                      <th className="px-4 py-2.5">Metode Asesmen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {pillars.map((pillar) => {
                      const weight = WEIGHTS[pillar.id];
                      return (
                        <tr key={pillar.id}>
                          <td className="px-4 py-2.5 font-bold">{pillar.label}</td>
                          <td className="px-4 py-2.5">{Math.round(weight * 100)}% ({weight.toFixed(2)})</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-600">{pillar.value.toFixed(2)}</td>
                          <td className="px-4 py-2.5">{(weight * pillar.value).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-500">{METHODS[pillar.id]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-800">
                N_DSS = (0.35 × A) + (0.25 × P) + (0.25 × J) + (0.15 × M) = {model.score.toFixed(2)}
              </p>
            </section>

            <section className="grid gap-5 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-7">
                <h2 className="text-sm font-bold text-slate-800 dark:text-ink-50">2. ATURAN ELIMINASI MUTLAK</h2>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-white/5">
                      <tr>
                        <th className="px-3 py-2">Parameter</th>
                        <th className="px-3 py-2">Bintara POLRI</th>
                        <th className="px-3 py-2">Taruna AKPOL</th>
                        <th className="px-3 py-2 text-center">Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {model.rows.map((row) => (
                        <tr key={row.name}>
                          <td className="px-3 py-2.5 font-medium">{row.name}</td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500">{row.bintara}</td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500">{row.akpol}</td>
                          <td className="px-3 py-2.5 text-center">
                            <ResultBadge result={row.result} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2 lg:col-span-5">
                <h2 className="text-sm font-bold text-slate-800 dark:text-ink-50">3. AMBANG BATAS & SKENARIO</h2>
                <Scenario title="SKENARIO HIJAU (MATCH)" rule="N_DSS ≥ 75.00 & Hard Pass" body="Disetujui di jalur target utama." tone="emerald" active={model.hard === 'PASS' && model.score >= 75} />
                <Scenario title="SKENARIO KUNING (WARNING)" rule="60.00 ≤ N_DSS < 75.00 & Hard Pass" body="Intervensi khusus: diet atau drill intensif." tone="amber" active={model.hard === 'PASS' && model.score >= 60 && model.score < 75} />
                <Scenario title="SKENARIO MERAH (AUTO-PIVOT)" rule="N_DSS < 60.00 atau Hard Fail" body="Pengalihan ke kedinasan sipil atau BUMN." tone="rose" active={model.hard === 'FAIL' || model.score < 60} />
              </div>
            </section>
          </div>
          <footer className="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-white/10">
            <Dialog.Close className="rounded-lg border border-slate-300 px-6 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-ink-50">
              Tutup
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ResultBadge({ result }: { result: CheckResult }) {
  const label = result === 'BELUM' ? 'BELUM' : result;
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-bold',
        result === 'PASS' && 'bg-emerald-100 text-emerald-700',
        result === 'FAIL' && 'bg-rose-100 text-rose-700',
        result === 'BELUM' && 'bg-slate-100 text-slate-500',
      )}
    >
      {label}
      {result === 'PASS' ? ' ✓' : ''}
    </span>
  );
}

function Scenario({
  title,
  rule,
  body,
  tone,
  active,
}: {
  title: string;
  rule: string;
  body: string;
  tone: 'emerald' | 'amber' | 'rose';
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 text-xs',
        tone === 'emerald' && 'border-emerald-200 bg-emerald-50/40',
        tone === 'amber' && 'border-amber-200 bg-amber-50/40',
        tone === 'rose' && 'border-rose-200 bg-rose-50/40',
        active && 'ring-2 ring-offset-1',
        active && tone === 'emerald' && 'ring-emerald-500',
        active && tone === 'amber' && 'ring-amber-500',
        active && tone === 'rose' && 'ring-rose-500',
      )}
    >
      <p className="font-bold">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-600">{rule}</p>
      <p className="mt-1 text-[11px] text-slate-700">{body}</p>
    </div>
  );
}
