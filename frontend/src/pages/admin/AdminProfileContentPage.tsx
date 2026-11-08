import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import type { ProfileCopy } from '@/types/siteContent';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaField, EditorSection, LinesField, TextField } from '@/components/admin/ContentFields';

export function AdminProfileContentPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-profile-content'], queryFn: () => apiGet<ProfileCopy>('/admin/site/profile-content') });
  const [draft, setDraft] = useState<ProfileCopy | null>(null);

  useEffect(() => {
    if (query.data) setDraft(structuredClone(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (body: ProfileCopy) => apiPut<ProfileCopy>('/admin/site/profile-content', body),
    onSuccess: (saved) => {
      toast.success('Profil lembaga disimpan');
      queryClient.setQueryData(['admin-profile-content'], saved);
      queryClient.invalidateQueries({ queryKey: ['profile-content'] });
    },
    onError: () => toast.error('Gagal menyimpan profil'),
  });

  if (query.isLoading || !draft) return <Skeleton className="h-96" />;

  return (
    <section className="page-shell space-y-5">
      <PageHeader
        variant="panel"
        eyebrow="Situs"
        title="Profil Lembaga"
        description="Judul, narasi, dan poin unggulan di halaman Tentang Kami."
        action={
          <Button type="button" onClick={() => save.mutate(draft)} isLoading={save.isPending}>
            Simpan profil
          </Button>
        }
      />
      <EditorSection title="Isi halaman">
        <TextField label="Judul" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <AreaField label="Narasi" rows={8} value={draft.body} onChange={(value) => setDraft({ ...draft, body: value })} hint="Baris kosong dipertahankan sebagai paragraf." />
        <LinesField label="Poin unggulan" value={draft.highlights} onChange={(value) => setDraft({ ...draft, highlights: value })} />
      </EditorSection>
    </section>
  );
}
