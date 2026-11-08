import { useQuery } from '@tanstack/react-query';
import { LandingSectionManager, type LandingResourceConfig } from '@/components/admin/LandingSectionManager';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';

type FaqItem = { id: string; question: string; answer: string; order: number };

const faqConfig: LandingResourceConfig = {
  key: 'faqs',
  title: 'Pertanyaan',
  endpoint: 'faq',
  primaryField: 'question',
  fields: [
    { name: 'question', label: 'Pertanyaan' },
    { name: 'answer', label: 'Jawaban', type: 'textarea' },
    { name: 'order', label: 'Urutan', type: 'number', defaultValue: 0 },
  ],
};

export function AdminFaqPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-landing'],
    queryFn: () => apiGet<{ faqs: FaqItem[] }>('/admin/landing'),
  });

  if (isError) return <p className="text-sm font-semibold text-rose-600">Gagal memuat FAQ.</p>;
  if (isLoading || !data) return <Skeleton className="h-64" />;

  return (
    <section className="page-shell">
      <PageHeader
        variant="panel"
        eyebrow="Situs"
        title="FAQ"
        description="Pertanyaan ini tampil di bagian bawah beranda. Judul bagian diatur di menu Beranda."
      />
      <LandingSectionManager config={faqConfig} items={data.faqs} packageOptions={[]} />
    </section>
  );
}
