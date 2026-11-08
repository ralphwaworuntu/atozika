import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';

export function AdminNotFoundPage() {
  return (
    <section className="page-shell space-y-4">
      <PageHeader
        variant="panel"
        eyebrow="Admin"
        title="Halaman tidak ditemukan"
        description="Menu yang Anda buka tidak ada di panel admin."
      />
      <Button asChild>
        <Link to="/admin">Kembali ke dashboard admin</Link>
      </Button>
    </section>
  );
}
