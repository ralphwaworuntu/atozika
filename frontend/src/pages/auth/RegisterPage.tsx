import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';
import { PasswordRequirements } from '@/components/common/PasswordRequirements';
import { strongPasswordSchema } from '@/lib/password';
import { digitsOnly, phoneSchema } from '@/lib/phone';

const registerSchema = z
  .object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    phone: phoneSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

function PasswordField({
  placeholder,
  error,
  registerProps,
}: {
  placeholder: string;
  error?: string;
  registerProps: ReturnType<ReturnType<typeof useForm<RegisterValues>>['register']>;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="relative">
        <Input
          placeholder={placeholder}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          className="h-12 pr-11 lg:h-14"
          {...registerProps}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-700"
          aria-label={visible ? `Sembunyikan ${placeholder}` : `Tampilkan ${placeholder}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export function RegisterPage() {
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref')?.trim() || undefined;

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      apiPost<{ email: string; verificationToken: string }>('/auth/register', {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        confirmPassword: values.confirmPassword,
        referralCode,
      }),
    onSuccess: (payload) => {
      toast.success('Registrasi berhasil! Silakan verifikasi email kamu.');
      navigate('/auth/verify', { state: { email: payload.email, verificationToken: payload.verificationToken } });
    },
    onError: () => toast.error('Gagal mendaftar, silakan coba lagi.'),
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </button>
      <PageHeader
        title="Daftar Member ATOZIKA"
        description="Isi data singkat di bawah ini untuk membuat akun."
      />
      <form className="space-y-4 lg:space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <Input placeholder="Nama Lengkap" className="h-12 lg:h-14" autoComplete="name" {...form.register('name')} />
          {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <Input placeholder="Email" type="email" className="h-12 lg:h-14" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <Input
            placeholder="No. Tlp / WA"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className="h-12 lg:h-14"
            {...form.register('phone', {
              onChange: (event) => {
                event.target.value = digitsOnly(event.target.value);
              },
            })}
          />
          {form.formState.errors.phone && <p className="mt-1 text-xs text-red-500">{form.formState.errors.phone.message}</p>}
        </div>
        <PasswordField
          placeholder="Password"
          error={form.formState.errors.password?.message}
          registerProps={form.register('password')}
        />
        <PasswordRequirements value={form.watch('password') ?? ''} />
        <PasswordField
          placeholder="Konfirmasi Password"
          error={form.formState.errors.confirmPassword?.message}
          registerProps={form.register('confirmPassword')}
        />
        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Memproses...' : 'Daftar & Verifikasi'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Sudah punya akun?{' '}
        <Link to="/auth/login" className="font-semibold text-brand-600">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
