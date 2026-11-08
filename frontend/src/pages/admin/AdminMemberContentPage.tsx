import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import type { MemberCopy, MemberTopic } from '@/types/siteContent';
import { dashboardMenu } from '@/constants/navigation';
import { LEARNING_TOPICS } from '@/constants/learningCatalog';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorSection, RemoveButton, TextField } from '@/components/admin/ContentFields';

const tileRoutes = [
  { value: '/app/latihan/tryout', label: 'Tryout' },
  { value: '/app/latihan-soal', label: 'Latihan soal' },
  { value: '/app/tes-kecermatan', label: 'Tes kecermatan' },
  { value: '/app/materi', label: 'Materi' },
  { value: '/app/pengumuman', label: 'Pengumuman' },
  { value: '/app/berita', label: 'Berita' },
  { value: '/app/kalkulator', label: 'Kalkulator' },
  { value: '/app/paket-membership', label: 'Paket membership' },
];

const blankTopic = (): MemberTopic => ({
  key: 'Topik',
  name: 'Topik baru',
  icon: '/illustrations/icon-twk.jpg',
  tint: 'from-sky-100 to-sky-50/40',
  bar: 'bg-sky-600',
  practice: { soal: 0, paket: 0, description: '', groups: ['Umum'] },
  material: { count: 0, progress: 0 },
});

function withMenu(data: MemberCopy): MemberCopy {
  const saved = new Map(data.menu.map((item) => [item.to, item]));
  return {
    ...data,
    topics: data.topics.length ? data.topics : LEARNING_TOPICS.map((topic) => ({ ...topic, practice: { ...topic.practice, groups: [...topic.practice.groups] }, material: { ...topic.material } })),
    menu: dashboardMenu.flatMap((section) =>
      section.items.map((item) => ({
        to: item.to,
        label: saved.get(item.to)?.label || item.label,
        hidden: saved.get(item.to)?.hidden ?? false,
      })),
    ),
  };
}

export function AdminMemberContentPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-member-content'], queryFn: () => apiGet<MemberCopy>('/admin/site/member-content') });
  const [draft, setDraft] = useState<MemberCopy | null>(null);

  useEffect(() => {
    if (query.data) setDraft(withMenu(structuredClone(query.data)));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (body: MemberCopy) => apiPut<MemberCopy>('/admin/site/member-content', body),
    onSuccess: () => {
      toast.success('Tampilan member disimpan');
      queryClient.invalidateQueries({ queryKey: ['admin-member-content'] });
      queryClient.invalidateQueries({ queryKey: ['member-chrome'] });
    },
    onError: () => toast.error('Gagal menyimpan tampilan member'),
  });

  if (query.isError) return <p className="text-sm font-semibold text-rose-600">Gagal memuat tampilan member.</p>;
  if (query.isLoading || !draft) return <Skeleton className="h-96" />;

  const patch = (recipe: (current: MemberCopy) => void) => {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      recipe(next);
      return next;
    });
  };

  return (
    <section className="page-shell space-y-5">
      <PageHeader
        variant="panel"
        eyebrow="Situs"
        title="Tampilan Member"
        description="Sapaan ringkasan, kartu keterampilan, menu samping, judul berita, dan ikon kategori belajar."
        action={
          <Button type="button" onClick={() => save.mutate(draft)} isLoading={save.isPending}>
            Simpan tampilan
          </Button>
        }
      />

      <EditorSection title="Sapaan ringkasan">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Pagi" value={draft.greetingMorning} onChange={(value) => patch((item) => { item.greetingMorning = value; })} />
          <TextField label="Siang" value={draft.greetingAfternoon} onChange={(value) => patch((item) => { item.greetingAfternoon = value; })} />
          <TextField label="Sore" value={draft.greetingEvening} onChange={(value) => patch((item) => { item.greetingEvening = value; })} />
          <TextField label="Malam" value={draft.greetingNight} onChange={(value) => patch((item) => { item.greetingNight = value; })} />
          <TextField label="Kalimat di bawah nama" value={draft.subtitle} onChange={(value) => patch((item) => { item.subtitle = value; })} />
          <TextField label="Lencana jika membership nonaktif" value={draft.inactiveBadge} onChange={(value) => patch((item) => { item.inactiveBadge = value; })} />
          <TextField label="Judul lanjut belajar" value={draft.continueTitle} onChange={(value) => patch((item) => { item.continueTitle = value; })} />
          <TextField label="Judul kartu keterampilan" value={draft.skillsTitle} onChange={(value) => patch((item) => { item.skillsTitle = value; })} />
          <TextField label="Tombol membership nonaktif" value={draft.ctaInactive} onChange={(value) => patch((item) => { item.ctaInactive = value; })} />
          <TextField label="Tombol lanjut review" value={draft.ctaReview} onChange={(value) => patch((item) => { item.ctaReview = value; })} />
          <TextField label="Tombol mulai tryout" value={draft.ctaStart} onChange={(value) => patch((item) => { item.ctaStart = value; })} />
          <TextField label="Tombol konfirmasi pembayaran" value={draft.ctaPayment} onChange={(value) => patch((item) => { item.ctaPayment = value; })} />
          <TextField label="Judul kartu pilar" value={draft.pillarTitle} onChange={(value) => patch((item) => { item.pillarTitle = value; })} />
          <TextField label="Deskripsi kartu pilar" value={draft.pillarDescription} onChange={(value) => patch((item) => { item.pillarDescription = value; })} />
        </div>
        <p className="text-xs text-slate-400">Slider gambar ringkasan diatur di menu Landing.</p>
      </EditorSection>

      <EditorSection title="Kartu keterampilan">
        <div className="space-y-3">
          {draft.skillTiles.map((tile, index) => (
            <div key={`${tile.to}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-3 dark:border-white/10">
              <TextField label="Label" value={tile.label} onChange={(value) => patch((item) => { item.skillTiles[index].label = value; })} />
              <TextField label="Keterangan" value={tile.hint} onChange={(value) => patch((item) => { item.skillTiles[index].hint = value; })} />
              <label className="block space-y-1">
                <span className="admin-field-label">Halaman tujuan</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900"
                  value={tile.to}
                  onChange={(event) => patch((item) => { item.skillTiles[index].to = event.target.value; })}
                >
                  {tileRoutes.map((route) => (
                    <option key={route.value} value={route.value}>{route.label}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Menu samping">
        <div className="space-y-2">
          {draft.menu.map((item, index) => (
            <div key={item.to} className="grid items-end gap-3 rounded-2xl border border-slate-100 p-3 md:grid-cols-[1fr_1fr_auto] dark:border-white/10">
              <p className="text-xs font-semibold text-slate-400">{item.to}</p>
              <TextField label="Label" value={item.label} onChange={(value) => patch((current) => { current.menu[index].label = value; })} />
              <label className="admin-check-row mb-2">
                <input type="checkbox" checked={item.hidden} onChange={(event) => patch((current) => { current.menu[index].hidden = event.target.checked; })} />
                Sembunyikan
              </label>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Judul bagian berita">
        <div className="space-y-3">
          {draft.newsSections.map((section, index) => (
            <div key={section.id} className="grid gap-3 md:grid-cols-2">
              <TextField label={`Filter ${section.id}`} value={section.label} onChange={(value) => patch((item) => { item.newsSections[index].label = value; })} />
              <TextField label="Judul bagian" value={section.title} onChange={(value) => patch((item) => { item.newsSections[index].title = value; })} />
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title="Kategori belajar"
        action={<Button type="button" variant="outline" onClick={() => patch((item) => { item.topics.push(blankTopic()); })}>Tambah kategori</Button>}
      >
        <p className="text-xs text-slate-400">Ikon dan nama ini dipakai di latihan soal, tryout, dan materi. Jumlah soal asli tetap dihitung dari paket yang ada.</p>
        <div className="space-y-4">
          {draft.topics.map((topic, index) => (
            <div key={`${topic.key}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-2 dark:border-white/10">
              <TextField label="Kunci pencocokan" value={topic.key} onChange={(value) => patch((item) => { item.topics[index].key = value; })} />
              <TextField label="Nama tampilan" value={topic.name} onChange={(value) => patch((item) => { item.topics[index].name = value; })} />
              <TextField label="Path ikon" value={topic.icon} onChange={(value) => patch((item) => { item.topics[index].icon = value; })} />
              <TextField label="Grup filter, pisahkan koma" value={topic.practice.groups.join(', ')} onChange={(value) => patch((item) => { item.topics[index].practice.groups = value.split(',').map((part) => part.trim()).filter(Boolean); })} />
              <TextField label="Deskripsi" value={topic.practice.description} onChange={(value) => patch((item) => { item.topics[index].practice.description = value; })} />
              <TextField label="Cadangan jumlah soal" type="number" value={String(topic.practice.soal)} onChange={(value) => patch((item) => { item.topics[index].practice.soal = Number(value) || 0; })} />
              <div className="md:col-span-2">
                <RemoveButton onClick={() => patch((item) => { item.topics.splice(index, 1); })} />
              </div>
            </div>
          ))}
        </div>
      </EditorSection>
    </section>
  );
}
