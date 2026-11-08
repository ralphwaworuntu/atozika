import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="admin-field-label">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="admin-field-label">{label}</span>
      <Textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function LinesField({
  label,
  value,
  onChange,
  hint = 'Satu baris untuk satu item.',
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  return (
    <AreaField label={label} value={value.join('\n')} onChange={(next) => onChange(next.split('\n'))} hint={hint} />
  );
}

export function EditorSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-ink-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-ink-50">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" onClick={onClick}>
      Hapus
    </Button>
  );
}
