import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import type { SiteBoards } from '@/types/siteContent';
import { Button } from '@/components/ui/button';
import { EditorSection, RemoveButton, TextField } from '@/components/admin/ContentFields';

const categories = ['Akademik', 'Jasmani', 'Administrasi', 'Urgent'];
const kinds = ['Tryout Akbar', 'Jam Kelas', 'Sesi Jasmani'];

export function BoardsEditor() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-boards'], queryFn: () => apiGet<SiteBoards>('/admin/site/boards') });
  const [draft, setDraft] = useState<SiteBoards | null>(null);

  useEffect(() => {
    if (query.data) setDraft(structuredClone(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (body: SiteBoards) => apiPut<SiteBoards>('/admin/site/boards', body),
    onSuccess: () => {
      toast.success('Jadwal dan pendaftaran disimpan');
      queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
      queryClient.invalidateQueries({ queryKey: ['member-chrome'] });
    },
    onError: () => toast.error('Gagal menyimpan jadwal'),
  });

  if (!draft) return null;

  const patch = (recipe: (current: SiteBoards) => void) => {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      recipe(next);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" onClick={() => save.mutate(draft)} isLoading={save.isPending}>Simpan jadwal</Button>
      </div>
      <EditorSection
        title="Jadwal kelas dan tryout"
        action={
          <Button type="button" variant="outline" onClick={() => patch((item) => { item.schedules.push({ id: `s-${Date.now()}`, category: 'Akademik', kind: 'Jam Kelas', title: 'Jadwal baru', time: '' }); })}>
            Tambah jadwal
          </Button>
        }
      >
        {draft.schedules.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-2 dark:border-white/10">
            <SelectField label="Kategori" value={item.category} options={categories} onChange={(value) => patch((board) => { board.schedules[index].category = value; })} />
            <SelectField label="Jenis" value={item.kind} options={kinds} onChange={(value) => patch((board) => { board.schedules[index].kind = value; })} />
            <TextField label="Judul" value={item.title} onChange={(value) => patch((board) => { board.schedules[index].title = value; })} />
            <TextField label="Waktu" value={item.time} onChange={(value) => patch((board) => { board.schedules[index].time = value; })} />
            <RemoveButton onClick={() => patch((board) => { board.schedules.splice(index, 1); })} />
          </div>
        ))}
      </EditorSection>
      <EditorSection
        title="Pembukaan pendaftaran"
        action={
          <Button type="button" variant="outline" onClick={() => patch((item) => { item.openings.push({ id: `o-${Date.now()}`, category: 'Administrasi', agency: '', title: 'Pendaftaran baru', window: '' }); })}>
            Tambah info
          </Button>
        }
      >
        {draft.openings.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-2 dark:border-white/10">
            <SelectField label="Kategori" value={item.category} options={categories} onChange={(value) => patch((board) => { board.openings[index].category = value; })} />
            <TextField label="Instansi" value={item.agency} onChange={(value) => patch((board) => { board.openings[index].agency = value; })} />
            <TextField label="Judul" value={item.title} onChange={(value) => patch((board) => { board.openings[index].title = value; })} />
            <TextField label="Periode" value={item.window} onChange={(value) => patch((board) => { board.openings[index].window = value; })} />
            <RemoveButton onClick={() => patch((board) => { board.openings.splice(index, 1); })} />
          </div>
        ))}
      </EditorSection>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const choices = options.includes(value) ? options : [value, ...options];
  return (
    <label className="block space-y-1">
      <span className="admin-field-label">{label}</span>
      <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900" value={value} onChange={(event) => onChange(event.target.value)}>
        {choices.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
