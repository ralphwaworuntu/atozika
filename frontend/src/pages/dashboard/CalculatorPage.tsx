import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useMemberChrome } from '@/hooks/useMemberChrome';
import type { CalculatorConfig } from '@/types/calculator';
import type { FitnessCopy } from '@/types/siteContent';

type Gender = 'L' | 'P';

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function preciseAge(birth: Date, opening: Date) {
  let years = opening.getFullYear() - birth.getFullYear();
  let months = opening.getMonth() - birth.getMonth();
  let days = opening.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(opening.getFullYear(), opening.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function bmiBand(bmi: number, min: number, max: number) {
  if (bmi < min) return 'Di bawah rentang';
  if (bmi <= max) return 'Rentang sehat';
  if (bmi < max + 5) return 'Di atas rentang';
  return 'Jauh di atas rentang';
}

const PHYSICAL: Array<{
  key: string;
  label: string;
  unit: string;
  higher: boolean;
  target: Record<Gender, number>;
  floor: Record<Gender, number>;
}> = [
  { key: 'pushup', label: 'Push-up', unit: 'kali', higher: true, target: { L: 45, P: 30 }, floor: { L: 0, P: 0 } },
  { key: 'situp', label: 'Sit-up', unit: 'kali', higher: true, target: { L: 42, P: 35 }, floor: { L: 0, P: 0 } },
  { key: 'pullup', label: 'Pull-up', unit: 'kali', higher: true, target: { L: 14, P: 8 }, floor: { L: 0, P: 0 } },
  { key: 'run', label: 'Lari 12 menit', unit: 'meter', higher: true, target: { L: 3000, P: 2600 }, floor: { L: 1500, P: 1200 } },
  { key: 'shuttle', label: 'Shuttle Run', unit: 'detik', higher: false, target: { L: 15.5, P: 17 }, floor: { L: 22, P: 24 } },
  { key: 'swim', label: 'Renang 50 m', unit: 'detik', higher: false, target: { L: 35, P: 45 }, floor: { L: 90, P: 110 } },
];

function itemScore(value: number, higher: boolean, target: number, floor: number) {
  if (higher) {
    if (target <= floor) return 0;
    return Math.min(100, Math.max(0, ((value - floor) / (target - floor)) * 100));
  }
  if (floor <= target) return 0;
  return Math.min(100, Math.max(0, ((floor - value) / (floor - target)) * 100));
}

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-member-600 dark:border-white/10 dark:bg-ink-900 dark:text-ink-50';

export function CalculatorPage() {
  const chrome = useMemberChrome();
  const fitness = chrome.data?.fitness;
  const [birth, setBirth] = useState('');
  const [opening, setOpening] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [physical, setPhysical] = useState<Record<string, string>>({});

  const age = useMemo(() => {
    const born = parseDate(birth);
    const open = parseDate(opening);
    if (!born || !open || open < born) return null;
    return preciseAge(born, open);
  }, [birth, opening]);

  const body = useMemo(() => {
    const cm = Number(height);
    const kg = Number(weight);
    if (!cm || !kg || cm < 100 || cm > 250 || kg < 30 || kg > 200) return null;
    const meters = cm / 100;
    const bmi = kg / (meters * meters);
    const minBmi = fitness?.bmiMin || 18.5;
    const maxBmi = fitness?.bmiMax || 24.9;
    const min = minBmi * meters * meters;
    const max = maxBmi * meters * meters;
    const adjust = kg > max ? { direction: 'turun', kg: kg - max } : kg < min ? { direction: 'naik', kg: min - kg } : null;
    return { bmi, min, max, adjust };
  }, [fitness?.bmiMax, fitness?.bmiMin, height, weight]);

  const scores = useMemo(() => {
    const rows = (fitness?.items?.length ? fitness.items : PHYSICAL.map(toFitnessItem)).map((item) => {
      const raw = physical[item.key];
      const value = raw === undefined || raw === '' ? null : Number(raw);
      if (value === null || !Number.isFinite(value) || value < 0) return { ...item, value: null, score: null };
      const score = itemScore(value, item.higher, gender === 'L' ? item.targetL : item.targetP, gender === 'L' ? item.floorL : item.floorP);
      return { ...item, value, score };
    });
    const filled = rows.filter((row) => row.score !== null);
    const total = filled.length ? filled.reduce((sum, row) => sum + (row.score ?? 0), 0) / filled.length : null;
    return { rows, total };
  }, [fitness?.items, gender, physical]);

  return (
    <div className="space-y-6">
      <section className="member-card space-y-4 p-5">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">
            {fitness?.ageTitle || 'Kalkulator Usia Presisi'}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            {fitness?.ageDescription || 'Usia dihitung sampai tanggal pembukaan pendidikan resmi.'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-[11px] font-bold uppercase text-slate-400">
            Tanggal lahir
            <input className={fieldClass} type="date" value={birth} onChange={(event) => setBirth(event.target.value)} />
          </label>
          <label className="space-y-1 text-[11px] font-bold uppercase text-slate-400">
            Tanggal pembukaan
            <input className={fieldClass} type="date" value={opening} onChange={(event) => setOpening(event.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Tahun', age ? String(age.years) : '–'],
            ['Bulan', age ? String(age.months) : '–'],
            ['Hari', age ? String(age.days) : '–'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-extrabold text-member-600">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="member-card space-y-4 p-5">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">
            {fitness?.bmiTitle || 'Kalkulator BMI & Berat Badan Ideal'}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            {fitness?.bmiDescription || 'Target penyesuaian berat badan memakai rentang BMI yang diatur admin.'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-[11px] font-bold uppercase text-slate-400">
            Tinggi (cm)
            <input className={fieldClass} inputMode="decimal" value={height} onChange={(event) => setHeight(event.target.value)} />
          </label>
          <label className="space-y-1 text-[11px] font-bold uppercase text-slate-400">
            Berat (kg)
            <input className={fieldClass} inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase text-slate-400">BMI</p>
            <p className="mt-1 text-xl font-extrabold text-member-600">{body ? body.bmi.toFixed(1) : '–'}</p>
            <p className="text-[11px] font-semibold text-slate-400">{body ? bmiBand(body.bmi, fitness?.bmiMin || 18.5, fitness?.bmiMax || 24.9) : 'Isi tinggi dan berat'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Berat ideal</p>
            <p className="mt-1 text-xl font-extrabold text-member-600">
              {body ? `${body.min.toFixed(1)}–${body.max.toFixed(1)}` : '–'}
            </p>
            <p className="text-[11px] font-semibold text-slate-400">kg</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Penyesuaian</p>
            <p className="mt-1 text-xl font-extrabold text-member-600">
              {body ? (body.adjust ? body.adjust.kg.toFixed(1) : '0') : '–'}
            </p>
            <p className="text-[11px] font-semibold text-slate-400">
              {body ? (body.adjust ? `kg perlu ${body.adjust.direction}` : 'Sudah di rentang') : 'Target BB'}
            </p>
          </div>
        </div>
      </section>

      <section className="member-card space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">
              {fitness?.physicalTitle || 'Kalkulator Skor Jasmani Baku POLRI/TNI'}
            </h2>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
              {fitness?.physicalDescription || 'Skor 0–100 adalah estimasi latihan berdasarkan target yang diatur admin.'}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-slate-200/70 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5">
            {(['L', 'P'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setGender(item)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${gender === item ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-ink-50' : 'text-slate-500'}`}
              >
                {item === 'L' ? 'Pria' : 'Wanita'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scores.rows.map((item) => (
            <label key={item.key} className="space-y-1 text-[11px] font-bold uppercase text-slate-400">
              {item.label} ({item.unit})
              <input
                className={fieldClass}
                inputMode="decimal"
                value={physical[item.key] ?? ''}
                onChange={(event) => setPhysical((current) => ({ ...current, [item.key]: event.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {scores.rows.map((row) => (
            <div key={row.key} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-400">{row.label}</p>
              <p className="mt-1 text-xl font-extrabold text-member-600">{row.score === null ? '–' : Math.round(row.score)}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Rata-rata skor</p>
          <p className="mt-1 text-xl font-extrabold text-member-600">{scores.total === null ? '–' : scores.total.toFixed(1)}</p>
        </div>
      </section>
      <ManagedCalculators />
    </div>
  );
}

function toFitnessItem(item: (typeof PHYSICAL)[number]): FitnessCopy['items'][number] {
  return {
    key: item.key,
    label: item.label,
    unit: item.unit,
    higher: item.higher,
    targetL: item.target.L,
    targetP: item.target.P,
    floorL: item.floor.L,
    floorP: item.floor.P,
  };
}

type RemoteCalculator = { id: string; slug: string; title: string; description: string; config: CalculatorConfig };
type RemoteGroup = { categoryLabel: string; items: RemoteCalculator[] };

function ManagedCalculators() {
  const groups = useQuery({ queryKey: ['member-calculators'], queryFn: () => apiGet<RemoteGroup[]>('/calculators') });
  const items = (groups.data ?? []).flatMap((group) => group.items ?? []);
  const [slug, setSlug] = useState('');
  const active = items.find((item) => item.slug === slug) ?? items[0];
  const [values, setValues] = useState<Record<string, string>>({});
  const result = useMemo(() => (active ? scoreConfigured(active.config, values) : null), [active, values]);
  if (!items.length) return null;
  return (
    <section className="member-card space-y-4 p-5">
      <div>
        <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">Kalkulator hasil tes</h2>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Bobot dan tabel skor mengikuti pengaturan admin.</p>
      </div>
      <label className="block space-y-1 text-[11px] font-bold uppercase text-slate-400">
        Pilih kalkulator
        <select className={fieldClass} value={active?.slug ?? ''} onChange={(event) => { setSlug(event.target.value); setValues({}); }}>
          {items.map((item) => (
            <option key={item.id} value={item.slug}>{item.title}</option>
          ))}
        </select>
      </label>
      {active ? <p className="text-xs font-semibold text-slate-500">{active.description}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {(active?.config.inputs ?? []).map((input) => (
          <label key={input.key} className="space-y-1 text-[11px] font-bold uppercase text-slate-400">
            {input.label} {input.unit ? `(${input.unit})` : ''}
            {input.type === 'select' ? (
              <select className={fieldClass} value={values[input.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [input.key]: event.target.value }))}>
                <option value="">Pilih</option>
                {(input.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input className={fieldClass} inputMode="decimal" value={values[input.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [input.key]: event.target.value }))} />
            )}
          </label>
        ))}
      </div>
      {result ? (
        <div className="space-y-2">
          {result.groups.map((group) => (
            <div key={group.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-white/5">
              <span className="font-semibold text-slate-600 dark:text-ink-200">{group.label}</span>
              <span className="font-extrabold text-member-600">{group.weightedValue.toFixed(1)}</span>
            </div>
          ))}
          <p className="text-sm font-extrabold text-slate-800 dark:text-ink-50">
            {active?.config.resultLabel || 'Nilai'} : {result.total.toFixed(1)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function scoreConfigured(config: CalculatorConfig, values: Record<string, string>) {
  const numeric = (key: string) => {
    const value = Number(values[key]);
    return Number.isFinite(value) ? value : 0;
  };
  const inputScore = (key: string) => {
    const value = numeric(key);
    const threshold = config.thresholds?.find((item) => item.inputKey === key);
    if (!threshold?.rows.length) return value;
    const rows = [...threshold.rows].sort((left, right) => left.value - right.value);
    if (threshold.comparison === 'LOWER_BETTER') {
      return (rows.find((row) => value <= row.value) ?? rows[rows.length - 1]).score;
    }
    const met = rows.filter((row) => value >= row.value);
    return (met[met.length - 1] ?? rows[0]).score;
  };
  const groups = (config.groups ?? []).map((group) => {
    const parts = group.inputs.map(inputScore);
    const raw = group.aggregator === 'average' && parts.length ? parts.reduce((sum, part) => sum + part, 0) / parts.length : parts.reduce((sum, part) => sum + part, 0);
    return { key: group.key, label: group.label, weightedValue: raw * (group.weight || 0) };
  });
  return { groups, total: groups.reduce((sum, group) => sum + group.weightedValue, 0) };
}
