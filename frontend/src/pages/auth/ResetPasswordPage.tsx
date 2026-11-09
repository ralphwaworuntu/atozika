import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';

const resetSchema = z.object({
  email: z.string().email('Email tidak valid'),
  code: z.string().regex(/^\d{6}$/, 'Masukkan 6 digit OTP'),
  password: z
    .string()
    .min(8, 'Minimal 8 karakter')
    .max(72, 'Maksimal 72 karakter')
    .regex(/[a-z]/, 'Harus berisi huruf kecil')
    .regex(/[A-Z]/, 'Harus berisi huruf besar')
    .regex(/[0-9]/, 'Harus berisi angka')
    .regex(/[^A-Za-z0-9]/, 'Harus berisi simbol')
    .refine((value) => !/\s/.test(value), 'Tidak boleh mengandung spasi'),
});

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = ((location.state as { email?: string } | null)?.email ?? '').trim();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: initialEmail, code: '', password: '' },
  });

  const resetMutation = useMutation({
    mutationFn: (values: ResetValues) =>
      apiPost<{ message: string }>('/auth/reset-password', {
        email: values.email,
        code: values.code,
        password: values.password,
      }),
    onSuccess: (payload) => {
      toast.success(payload.message || 'Password berhasil diganti.');
      navigate('/auth/login', { replace: true });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Gagal mengganti password.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => apiPost<{ message: string; otp?: string }>('/auth/forgot-password', { email: form.getValues('email') }),
    onSuccess: (payload) => {
      toast.success(payload.message || 'Kode OTP baru dikirim ke email Anda.');
      if (payload.otp) toast.message(`Kode lokal: ${payload.otp}`);
    },
    onError: () => toast.error('Gagal mengirim ulang OTP'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ganti Password"
        description="Masukkan kode OTP 6 digit dari email, lalu buat password baru. Kode berlaku 10 menit."
      />
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => resetMutation.mutate(values))}>
        <div>
          <Input type="email" placeholder="Email" className="h-12" {...form.register('email')} />
          {form.formState.errors.email && <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Kode OTP"
            className="h-12 text-center text-lg font-bold tracking-[0.4em]"
            {...form.register('code')}
          />
          {form.formState.errors.code && <p className="mt-1 text-xs text-red-500">{form.formState.errors.code.message}</p>}
        </div>
        <div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Password baru"
              className="h-12 pr-11"
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-700"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={resetMutation.isPending}>
          Ganti password
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!form.watch('email') || resendMutation.isPending}
        onClick={() => resendMutation.mutate()}
      >
        Kirim ulang OTP
      </Button>
    </div>
  );
}
