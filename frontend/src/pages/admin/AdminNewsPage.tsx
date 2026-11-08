import { useQuery } from '@tanstack/react-query';
import { LandingSectionManager, type LandingResourceConfig } from '@/components/admin/LandingSectionManager';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';

type LandingNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl?: string;
  kind: string;
};

const newsConfig: LandingResourceConfig = {
  key: 'news',
  title: 'Artikel Berita',
  endpoint: 'news',
  primaryField: 'title',
  secondaryField: 'slug',
  fields: [
    { name: 'title', label: 'Judul' },
    { name: 'slug', label: 'Slug' },
    { name: 'excerpt', label: 'Ringkasan', type: 'textarea' },
    { name: 'content', label: 'Konten', type: 'textarea' },
    { name: 'kind', label: 'Kategori', placeholder: 'EDUKASI, KUOTA, ALUMNI, atau NEWS', defaultValue: 'EDUKASI' },
  ],
  uploadField: {
    name: 'coverImage',
    label: 'Cover Artikel (Opsional)',
    previewKey: 'coverUrl',
    helper: 'JPG/PNG/WEBP maksimal 4MB. Kosongkan jika tanpa cover.',
    accept: 'image/*',
  },
};

export function AdminNewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-landing'],
    queryFn: () => apiGet<{ news: LandingNews[] }>('/admin/landing'),
  });

  if (isLoading || !data) {
    return <Skeleton className="h-64" />;
  }

  return (
    <section className="page-shell">
      <PageHeader
        variant="panel"
        eyebrow="Informasi"
        title="Berita"
        description="Artikel ini tampil di halaman Berita member. Kategori EDUKASI, KUOTA, atau ALUMNI mengikuti filter di dashboard."
      />
      <LandingSectionManager config={newsConfig} items={data.news} packageOptions={[]} />
    </section>
  );
}
