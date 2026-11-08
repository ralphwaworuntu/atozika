import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import type { HomeCopy } from '@/types/siteContent';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorSection, LinesField, RemoveButton, TextField, AreaField } from '@/components/admin/ContentFields';

const icons = [
  { value: 'monitor', label: 'Layar / CAT' },
  { value: 'timer', label: 'Timer' },
  { value: 'activity', label: 'Jasmani' },
  { value: 'heart', label: 'Medis' },
  { value: 'book', label: 'Buku' },
  { value: 'list', label: 'Daftar' },
];

export function AdminBerandaPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-home-content'], queryFn: () => apiGet<HomeCopy>('/admin/site/home-content') });
  const [draft, setDraft] = useState<HomeCopy | null>(null);

  useEffect(() => {
    if (query.data) setDraft(structuredClone(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (body: HomeCopy) => apiPut<HomeCopy>('/admin/site/home-content', body),
    onSuccess: (saved) => {
      toast.success('Beranda disimpan');
      queryClient.setQueryData(['admin-home-content'], saved);
      queryClient.invalidateQueries({ queryKey: ['home-content'] });
    },
    onError: () => toast.error('Gagal menyimpan beranda'),
  });

  if (query.isLoading || !draft) return <Skeleton className="h-96" />;

  const patch = (recipe: (current: HomeCopy) => void) => {
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
        title="Beranda"
        description="Teks hero, tentang lembaga, pilar, promo, dan katalog program yang tampil di halaman depan."
        action={
          <Button type="button" onClick={() => save.mutate(draft)} isLoading={save.isPending}>
            Simpan beranda
          </Button>
        }
      />

      <EditorSection title="Hero">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Judul" value={draft.hero.title} onChange={(value) => patch((item) => { item.hero.title = value; })} />
          <TextField label="Subjudul" value={draft.hero.subtitle} onChange={(value) => patch((item) => { item.hero.subtitle = value; })} />
          <TextField label="Tombol utama" value={draft.hero.ctaPrimary.label} onChange={(value) => patch((item) => { item.hero.ctaPrimary.label = value; })} />
          <TextField label="Tautan tombol utama" value={draft.hero.ctaPrimary.href} onChange={(value) => patch((item) => { item.hero.ctaPrimary.href = value; })} />
          <TextField label="Tombol kedua" value={draft.hero.ctaSecondary.label} onChange={(value) => patch((item) => { item.hero.ctaSecondary.label = value; })} />
          <TextField label="Tautan tombol kedua" value={draft.hero.ctaSecondary.href} onChange={(value) => patch((item) => { item.hero.ctaSecondary.href = value; })} />
        </div>
        <p className="text-xs text-slate-400">Gambar slider hero diatur di menu Landing.</p>
      </EditorSection>

      <EditorSection title="Tentang ATOZIKA">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Label kecil" value={draft.about.eyebrow} onChange={(value) => patch((item) => { item.about.eyebrow = value; })} />
          <TextField label="Judul" value={draft.about.title} onChange={(value) => patch((item) => { item.about.title = value; })} />
        </div>
        <LinesField label="Paragraf" value={draft.about.paragraphs} onChange={(value) => patch((item) => { item.about.paragraphs = value; })} hint="Satu paragraf per baris." />
        <TextField label="Judul keunggulan" value={draft.about.advantagesTitle} onChange={(value) => patch((item) => { item.about.advantagesTitle = value; })} />
        <LinesField label="Daftar keunggulan" value={draft.about.advantages} onChange={(value) => patch((item) => { item.about.advantages = value; })} />
      </EditorSection>

      <EditorSection title="Tantangan dan alasan">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Label tantangan" value={draft.challenges.eyebrow} onChange={(value) => patch((item) => { item.challenges.eyebrow = value; })} />
          <TextField label="Judul tantangan" value={draft.challenges.title} onChange={(value) => patch((item) => { item.challenges.title = value; })} />
        </div>
        <LinesField label="Poin tantangan" value={draft.challenges.items} onChange={(value) => patch((item) => { item.challenges.items = value; })} />
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Label alasan" value={draft.reasonsEyebrow} onChange={(value) => patch((item) => { item.reasonsEyebrow = value; })} />
          <TextField label="Judul alasan" value={draft.reasonsTitle} onChange={(value) => patch((item) => { item.reasonsTitle = value; })} />
        </div>
        <LinesField label="Alasan memilih ATOZIKA" value={draft.reasons} onChange={(value) => patch((item) => { item.reasons = value; })} />
      </EditorSection>

      <EditorSection
        title="Pilar seleksi"
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patch((item) => {
                item.pillars.items.push({
                  number: String(item.pillars.items.length + 1).padStart(2, '0'),
                  title: 'Pilar baru',
                  description: '',
                  ctaLabel: 'Selengkapnya',
                  ctaHref: '/profil',
                  icon: 'book',
                });
              })
            }
          >
            Tambah pilar
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <TextField label="Label kecil" value={draft.pillars.eyebrow} onChange={(value) => patch((item) => { item.pillars.eyebrow = value; })} />
          <TextField label="Judul" value={draft.pillars.title} onChange={(value) => patch((item) => { item.pillars.title = value; })} />
          <TextField label="Deskripsi" value={draft.pillars.description} onChange={(value) => patch((item) => { item.pillars.description = value; })} />
        </div>
        <div className="space-y-4">
          {draft.pillars.items.map((pillar, index) => (
            <div key={`${pillar.number}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-2 dark:border-white/10">
              <TextField label="Nomor" value={pillar.number} onChange={(value) => patch((item) => { item.pillars.items[index].number = value; })} />
              <label className="block space-y-1">
                <span className="admin-field-label">Ikon</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900"
                  value={pillar.icon}
                  onChange={(event) => patch((item) => { item.pillars.items[index].icon = event.target.value; })}
                >
                  {icons.map((icon) => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </label>
              <TextField label="Judul" value={pillar.title} onChange={(value) => patch((item) => { item.pillars.items[index].title = value; })} />
              <TextField label="Teks tombol" value={pillar.ctaLabel} onChange={(value) => patch((item) => { item.pillars.items[index].ctaLabel = value; })} />
              <TextField label="Tautan" value={pillar.ctaHref} onChange={(value) => patch((item) => { item.pillars.items[index].ctaHref = value; })} />
              <AreaField label="Deskripsi" rows={3} value={pillar.description} onChange={(value) => patch((item) => { item.pillars.items[index].description = value; })} />
              <div className="md:col-span-2">
                <RemoveButton onClick={() => patch((item) => { item.pillars.items.splice(index, 1); })} />
              </div>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Promo kuota">
        <label className="admin-check-row">
          <input type="checkbox" checked={draft.promo.enabled} onChange={(event) => patch((item) => { item.promo.enabled = event.target.checked; })} />
          Tampilkan promo di beranda
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Label" value={draft.promo.eyebrow} onChange={(value) => patch((item) => { item.promo.eyebrow = value; })} />
          <TextField label="Lencana" value={draft.promo.badge} onChange={(value) => patch((item) => { item.promo.badge = value; })} />
          <TextField label="Judul" value={draft.promo.title} onChange={(value) => patch((item) => { item.promo.title = value; })} />
          <TextField label="Berakhir" type="datetime-local" value={toLocalInput(draft.promo.endsAt)} onChange={(value) => patch((item) => { item.promo.endsAt = value ? new Date(value).toISOString() : item.promo.endsAt; })} />
          <TextField label="Tombol" value={draft.promo.ctaLabel} onChange={(value) => patch((item) => { item.promo.ctaLabel = value; })} />
          <TextField label="Tautan" value={draft.promo.ctaHref} onChange={(value) => patch((item) => { item.promo.ctaHref = value; })} />
          <TextField label="Kuota total" type="number" value={String(draft.promo.quotaTotal)} onChange={(value) => patch((item) => { item.promo.quotaTotal = Number(value) || 0; })} />
          <TextField label="Kuota tersisa" type="number" value={String(draft.promo.quotaRemaining)} onChange={(value) => patch((item) => { item.promo.quotaRemaining = Number(value) || 0; })} />
        </div>
        <AreaField label="Deskripsi" value={draft.promo.description} onChange={(value) => patch((item) => { item.promo.description = value; })} />
      </EditorSection>

      <EditorSection
        title="Katalog program"
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patch((item) => {
                item.programs.tiers.push({
                  tier: `Tier ${item.programs.tiers.length + 1}`,
                  name: 'Program baru',
                  price: 0,
                  originalPrice: 0,
                  features: ['Fitur'],
                  ctaLabel: 'Daftar',
                  ctaHref: '/auth/register',
                  ctaVariant: 'primary',
                  featured: false,
                  badge: '',
                });
              })
            }
          >
            Tambah program
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Judul" value={draft.programs.title} onChange={(value) => patch((item) => { item.programs.title = value; })} />
          <TextField label="Subjudul" value={draft.programs.subtitle} onChange={(value) => patch((item) => { item.programs.subtitle = value; })} />
        </div>
        {draft.programs.tiers.map((tier, index) => (
          <div key={`${tier.tier}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-2 dark:border-white/10">
            <TextField label="Tier" value={tier.tier} onChange={(value) => patch((item) => { item.programs.tiers[index].tier = value; })} />
            <TextField label="Nama" value={tier.name} onChange={(value) => patch((item) => { item.programs.tiers[index].name = value; })} />
            <TextField label="Harga" type="number" value={String(tier.price)} onChange={(value) => patch((item) => { item.programs.tiers[index].price = Number(value) || 0; })} />
            <TextField label="Harga coret" type="number" value={String(tier.originalPrice)} onChange={(value) => patch((item) => { item.programs.tiers[index].originalPrice = Number(value) || 0; })} />
            <TextField label="Teks tombol" value={tier.ctaLabel} onChange={(value) => patch((item) => { item.programs.tiers[index].ctaLabel = value; })} />
            <TextField label="Tautan atau whatsapp" value={tier.ctaHref} onChange={(value) => patch((item) => { item.programs.tiers[index].ctaHref = value; })} />
            <label className="block space-y-1">
              <span className="admin-field-label">Gaya tombol</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900"
                value={tier.ctaVariant}
                onChange={(event) => patch((item) => { item.programs.tiers[index].ctaVariant = event.target.value; })}
              >
                <option value="outline">Garis</option>
                <option value="primary">Utama</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
            <TextField label="Lencana" value={tier.badge} onChange={(value) => patch((item) => { item.programs.tiers[index].badge = value; })} />
            <label className="admin-check-row">
              <input type="checkbox" checked={tier.featured} onChange={(event) => patch((item) => { item.programs.tiers[index].featured = event.target.checked; })} />
              Sorot sebagai program unggulan
            </label>
            <LinesField label="Fitur" value={tier.features} onChange={(value) => patch((item) => { item.programs.tiers[index].features = value; })} />
            <div className="md:col-span-2">
              <RemoveButton onClick={() => patch((item) => { item.programs.tiers.splice(index, 1); })} />
            </div>
          </div>
        ))}
      </EditorSection>

      <EditorSection title="Judul FAQ dan video">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Label FAQ" value={draft.faq.eyebrow} onChange={(value) => patch((item) => { item.faq.eyebrow = value; })} />
          <TextField label="Judul FAQ" value={draft.faq.title} onChange={(value) => patch((item) => { item.faq.title = value; })} />
          <TextField label="Deskripsi FAQ" value={draft.faq.description} onChange={(value) => patch((item) => { item.faq.description = value; })} />
          <TextField label="Label video" value={draft.videos.eyebrow} onChange={(value) => patch((item) => { item.videos.eyebrow = value; })} />
          <TextField label="Judul video" value={draft.videos.title} onChange={(value) => patch((item) => { item.videos.title = value; })} />
        </div>
        <p className="text-xs text-slate-400">Isi pertanyaan ada di menu FAQ. Video ada di menu Landing.</p>
      </EditorSection>
    </section>
  );
}

function toLocalInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
