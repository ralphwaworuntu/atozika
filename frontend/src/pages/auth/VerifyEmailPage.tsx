import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';

const verifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Masukkan 6 digit OTP'),
});

type VerifyValues = z.infer<typeof verifySchema>;

type LocationState = {
  email?: string;
};

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const state = (location.state as LocationState) || {};
  const [email, setEmail] = useState(state.email ?? '');
  const form = useForm<VerifyValues>({ resolver: zodResolver(verifySchema), defaultValues: { code: '' } });

  const verifyMutation = useMutation({
    mutationFn: (values: VerifyValues) =>
      apiPost<{ user: AuthUser; accessToken: string; refreshToken: string }>('/auth/verify-email', {
        email,
        code: values.code,
      }),
    onSuccess: (payload) => {
      setSession(payload);
      toast.success('Email berhasil diverifikasi. Selamat datang!');
      const target = payload.user.role === 'ADMIN' ? '/admin' : '/app';
      navigate(target, { replace: true });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Kode OTP tidak valid.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => apiPost<{ message: string; otp?: string }>('/auth/resend-verification', { email }),
    onSuccess: (payload) => {
      toast.success(payload.message || 'Kode OTP baru dikirim ke email Anda.');
      if (payload.otp) {
        toast.message(`Kode lokal: ${payload.otp}`);
      }
    },
    onError: () => toast.error('Gagal mengirim ulang OTP'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Email"
        description={`Masukkan 6 digit OTP yang dikirim ke ${email || 'email Anda'}. Kode berlaku 10 menit.`}
      />

      <form className="space-y-4" onSubmit={form.handleSubmit((values) => verifyMutation.mutate(values))}>
        <div>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg font-bold tracking-[0.4em]"
            {...form.register('code')}
          />
          {form.formState.errors.code && <p className="mt-1 text-xs text-red-500">{form.formState.errors.code.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={verifyMutation.isPending} disabled={!email}>
          Verifikasi & Masuk
        </Button>
      </form>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Belum menerima email?</p>
        <p className="mt-1 text-xs text-slate-500">Pastikan email benar, lalu kirim ulang OTP.</p>
        <Input
          className="mt-3"
          type="email"
          placeholder="Email terdaftar"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => resendMutation.mutate()}
          disabled={!email}
          isLoading={resendMutation.isPending}
        >
          Kirim Ulang OTP
        </Button>
      </div>
    </div>
  );
}
