import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import type { Material } from '@/types/exam';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { MATERIAL_CATEGORIES, MATERIAL_TYPE_LABELS } from '@/constants/materials';

const materialTypes = ['PDF', 'VIDEO', 'LINK'] as const;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
};

const selectClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function AdminMaterialsPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['admin-materials'], queryFn: () => apiGet<Material[]>('/admin/materials') });
  const [editing, setEditing] = useState<Material | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<Omit<Material, 'id' | 'createdAt'>>({
    defaultValues: { title: '', category: 'POLRI', type: 'PDF', description: '', fileUrl: '' },
  });
  const [memberId, setMemberId] = useState('');
  const [memberCategories, setMemberCategories] = useState<string[]>([]);
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiGet<AdminUser[]>('/admin/users'),
  });
  const members = (users ?? []).filter((user) => user.role === 'MEMBER');
  const accessQuery = useQuery({
    queryKey: ['admin-material-categories', memberId],
    queryFn: () => apiGet<{ categories: string[] }>(`/admin/users/${memberId}/material-categories`),
    enabled: Boolean(memberId),
  });

  const mutation = useMutation<void, unknown, Omit<Material, 'id' | 'createdAt'>>({
    mutationFn: (values: Omit<Material, 'id' | 'createdAt'>) =>
      editing ? apiPut(`/admin/materials/${editing.id}`, values) : apiPost('/admin/materials', values),
    onSuccess: () => {
      toast.success('Materi disimpan');
      setEditing(null);
      form.reset({ title: '', category: 'POLRI', type: 'PDF', description: '', fileUrl: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
    },
    onError: () => toast.error('Gagal menyimpan materi'),
  });

  const deleteMutation = useMutation<void, unknown, string>({
    mutationFn: (id: string) => apiDelete(`/admin/materials/${id}`),
    onSuccess: (_data, id) => {
      toast.success('Materi dihapus');
      if (editing && editing.id === id) {
        setEditing(null);
        form.reset({ title: '', category: 'POLRI', type: 'PDF', description: '', fileUrl: '' });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
    },
    onError: () => toast.error('Tidak dapat menghapus materi'),
  });

  useEffect(() => {
    if (accessQuery.data) {
      setMemberCategories(accessQuery.data.categories ?? []);
    }
  }, [accessQuery.data]);

  const saveAccess = useMutation({
    mutationFn: () => apiPut(`/admin/users/${memberId}/material-categories`, { categories: memberCategories }),
    onSuccess: () => {
      toast.success('Kategori materi member disimpan');
      queryClient.invalidateQueries({ queryKey: ['admin-material-categories', memberId] });
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: () => toast.error('Gagal menyimpan kategori materi member'),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const materials = data ?? [];
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/admin/materials/export', {
        responseType: 'blob',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'daftar-materi.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Gagal mengunduh CSV materi');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader
        variant="panel"
        eyebrow="Admin"
        title="Materi Belajar"
        description="Upload atau edit modul PDF, video class, maupun tautan."
        action={
          <Button type="button" variant="outline" onClick={handleExport} isLoading={isExporting}>
            Download CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow-label">{editing ? 'Edit Materi' : 'Tambah Materi'}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{editing ? editing.title : 'Form Materi'}</h3>
            </div>
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  form.reset({ title: '', category: 'POLRI', type: 'PDF', description: '', fileUrl: '' });
                }}
              >
                Batal
              </Button>
            )}
          </div>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <label className="admin-field-label">Judul</label>
              <Input placeholder="Judul" {...form.register('title')} />
            </div>
            <div>
              <label className="admin-field-label">Kategori</label>
              <select className={selectClassName} {...form.register('category')}>
                {MATERIAL_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-field-label">Tipe</label>
              <select className={selectClassName} {...form.register('type')}>
                {materialTypes.map((type) => (
                  <option key={type} value={type}>
                    {MATERIAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-field-label">URL File</label>
              <Input placeholder="URL File" {...form.register('fileUrl')} />
            </div>
            <div className="md:col-span-2">
              <label className="admin-field-label">Deskripsi</label>
              <Textarea placeholder="Deskripsi" {...form.register('description')} />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="md:col-span-2">
              {mutation.isPending ? 'Menyimpan...' : editing ? 'Perbarui Materi' : 'Tambah Materi'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="eyebrow-label">Akses member</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Kategori materi untuk member</h3>
            <p className="mt-1 text-sm text-slate-500">
              Member hanya melihat modul setelah kategori ini dipilih.
            </p>
          </div>
          <div className="max-w-md">
            <label className="admin-field-label">Member</label>
            <select
              className={selectClassName}
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value);
                setMemberCategories([]);
              }}
            >
              <option value="">Pilih member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} • {member.email}
                </option>
              ))}
            </select>
          </div>
          {memberId && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {MATERIAL_CATEGORIES.map((item) => {
                  const checked = memberCategories.includes(item);
                  return (
                    <label key={item} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setMemberCategories((current) =>
                            checked ? current.filter((value) => value !== item) : [...current, item],
                          );
                        }}
                      />
                      {item}
                    </label>
                  );
                })}
              </div>
              <Button type="button" onClick={() => saveAccess.mutate()} disabled={saveAccess.isPending || accessQuery.isLoading}>
                {saveAccess.isPending ? 'Menyimpan...' : 'Simpan kategori member'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Daftar Materi ({materials.length})</h3>
          {isLoading && <Skeleton className="h-48" />}
          <div className="grid gap-4 md:grid-cols-2">
            {materials.map((material) => (
              <div key={material.id} className="admin-list-item">
                <p className="font-semibold text-slate-900">{material.title}</p>
                <p className="text-xs text-slate-500">{material.category} • {material.type}</p>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{material.description}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(material);
                      form.reset({
                        title: material.title,
                        category: material.category,
                        type: material.type,
                        description: material.description ?? '',
                        fileUrl: material.fileUrl,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(material.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Hapus
                  </Button>
                  <Button size="sm" asChild>
                    <a href={material.fileUrl} target="_blank" rel="noreferrer">
                      Buka
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            {!isLoading && materials.length === 0 && <p className="text-sm text-slate-500">Belum ada materi.</p>}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
