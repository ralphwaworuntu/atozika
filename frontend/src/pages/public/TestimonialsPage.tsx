import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

type TestimonialsResponse = Array<{ id: string; name: string; message: string; role?: string }>;

export function TestimonialsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['testimonials'], queryFn: () => apiGet<TestimonialsResponse>('/landing/testimonials') });

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  return (
    <section>
      <h1 className="type-hero text-ink-50">Testimoni dari Para Alumni ATOZIKA</h1>
      <p className="type-body mt-2 text-ink-200">Kumpulan cerita lolos TNI, Polri, kedinasan, CPNS, BUMN, hingga Bank Indonesia.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {data.map((item) => (
          <div key={item.id} className="surface-card p-6">
            <p className="text-sm text-slate-600">“{item.message}”</p>
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              {item.role && <p className="text-xs text-slate-500">{item.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
