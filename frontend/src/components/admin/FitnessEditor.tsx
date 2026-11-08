import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import type { FitnessCopy } from '@/types/siteContent';
import { Button } from '@/components/ui/button';
import { EditorSection, RemoveButton, TextField, AreaField } from '@/components/admin/ContentFields';

export function FitnessEditor() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-fitness'], queryFn: () => apiGet<FitnessCopy>('/admin/site/fitness') });
  const [draft, setDraft] = useState<FitnessCopy | null>(null);

  useEffect(() => {
    if (query.data) setDraft(structuredClone(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (body: FitnessCopy) => apiPut<FitnessCopy>('/admin/site/fitness', body),
    onSuccess: () => {
      toast.success('Kalkulator jasmani disimpan');
      queryClient.invalidateQueries({ queryKey: ['admin-fitness'] });
      queryClient.invalidateQueries({ queryKey: ['member-chrome'] });
    },
    onError: () => toast.error('Gagal menyimpan kalkulator jasmani'),
  });

  if (!draft) return null;

  const patch = (recipe: (current: FitnessCopy) => void) => {
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
        <Button type="button" onClick={() => save.mutate(draft)} isLoading={save.isPending}>Simpan kalkulator jasmani</Button>
      </div>
      <EditorSection title="Usia dan BMI">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Judul usia" value={draft.ageTitle} onChange={(value) => patch((item) => { item.ageTitle = value; })} />
          <TextField label="Judul BMI" value={draft.bmiTitle} onChange={(value) => patch((item) => { item.bmiTitle = value; })} />
          <AreaField label="Keterangan usia" value={draft.ageDescription} onChange={(value) => patch((item) => { item.ageDescription = value; })} />
          <AreaField label="Keterangan BMI" value={draft.bmiDescription} onChange={(value) => patch((item) => { item.bmiDescription = value; })} />
          <TextField label="BMI minimum ideal" type="number" value={String(draft.bmiMin)} onChange={(value) => patch((item) => { item.bmiMin = Number(value) || 0; })} />
          <TextField label="BMI maksimum ideal" type="number" value={String(draft.bmiMax)} onChange={(value) => patch((item) => { item.bmiMax = Number(value) || 0; })} />
        </div>
      </EditorSection>
      <EditorSection
        title="Skor jasmani baku"
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => patch((item) => { item.items.push({ key: `item-${item.items.length + 1}`, label: 'Item baru', unit: 'kali', higher: true, targetL: 0, targetP: 0, floorL: 0, floorP: 0 }); })}
          >
            Tambah item
          </Button>
        }
      >
        <TextField label="Judul" value={draft.physicalTitle} onChange={(value) => patch((item) => { item.physicalTitle = value; })} />
        <AreaField label="Keterangan" value={draft.physicalDescription} onChange={(value) => patch((item) => { item.physicalDescription = value; })} />
        {draft.items.map((item, index) => (
          <div key={`${item.key}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-4 dark:border-white/10">
            <TextField label="Label" value={item.label} onChange={(value) => patch((current) => { current.items[index].label = value; })} />
            <TextField label="Satuan" value={item.unit} onChange={(value) => patch((current) => { current.items[index].unit = value; })} />
            <TextField label="Target pria" type="number" value={String(item.targetL)} onChange={(value) => patch((current) => { current.items[index].targetL = Number(value) || 0; })} />
            <TextField label="Target wanita" type="number" value={String(item.targetP)} onChange={(value) => patch((current) => { current.items[index].targetP = Number(value) || 0; })} />
            <TextField label="Batas pria" type="number" value={String(item.floorL)} onChange={(value) => patch((current) => { current.items[index].floorL = Number(value) || 0; })} />
            <TextField label="Batas wanita" type="number" value={String(item.floorP)} onChange={(value) => patch((current) => { current.items[index].floorP = Number(value) || 0; })} />
            <label className="admin-check-row md:col-span-2">
              <input type="checkbox" checked={item.higher} onChange={(event) => patch((current) => { current.items[index].higher = event.target.checked; })} />
              Nilai lebih tinggi lebih baik
            </label>
            <RemoveButton onClick={() => patch((current) => { current.items.splice(index, 1); })} />
          </div>
        ))}
      </EditorSection>
    </div>
  );
}
