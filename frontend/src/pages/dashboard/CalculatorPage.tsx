import { useMemo, useState } from 'react';

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

function bmiBand(bmi: number) {
  if (bmi < 18.5) return 'Di bawah rentang';
  if (bmi < 25) return 'Rentang sehat';
  if (bmi < 30) return 'Di atas rentang';
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
    const min = 18.5 * meters * meters;
    const max = 24.9 * meters * meters;
    const adjust = kg > max ? { direction: 'turun', kg: kg - max } : kg < min ? { direction: 'naik', kg: min - kg } : null;
    return { bmi, min, max, adjust };
  }, [height, weight]);

  const scores = useMemo(() => {
    const rows = PHYSICAL.map((item) => {
      const raw = physical[item.key];
      const value = raw === undefined || raw === '' ? null : Number(raw);
      if (value === null || !Number.isFinite(value) || value < 0) return { ...item, value: null, score: null };
      const score = itemScore(value, item.higher, item.target[gender], item.floor[gender]);
      return { ...item, value, score };
    });
    const filled = rows.filter((row) => row.score !== null);
    const total = filled.length ? filled.reduce((sum, row) => sum + (row.score ?? 0), 0) / filled.length : null;
    return { rows, total };
  }, [gender, physical]);

  return (
    <div className="space-y-6">
      <section className="member-card space-y-4 p-5">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-ink-50">
            Kalkulator Usia Presisi
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            Usia dihitung sampai tanggal pembukaan pendidikan resmi.
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
            Kalkulator BMI & Berat Badan Ideal
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            Target penyesuaian berat badan memakai rentang BMI 18,5–24,9.
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
            <p className="text-[11px] font-semibold text-slate-400">{body ? bmiBand(body.bmi) : 'Isi tinggi dan berat'}</p>
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
              Kalkulator Skor Jasmani Baku POLRI/TNI
            </h2>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
              Push-up, sit-up, pull-up, lari 12 menit, shuttle run, dan renang. Skor 0–100 adalah estimasi latihan.
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
          {PHYSICAL.map((item) => (
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
    </div>
  );
}
