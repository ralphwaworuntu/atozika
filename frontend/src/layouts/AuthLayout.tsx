import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="theme-ink relative flex min-h-dvh flex-col bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:max-w-7xl lg:flex-row lg:gap-16 lg:px-10 xl:gap-20">
        <div className="w-full max-w-xl text-center lg:flex-1 lg:text-left">
          <h1 className="type-hero text-ink-50">
            Disiplin. Tegas. Elit.
          </h1>
          <p className="type-body mt-4 max-w-lg text-ink-200">
            Dashboard member ATOZIKA untuk tryout, latihan soal, tes kecermatan, dan persiapan seleksi TNI, Polri,
            Kedinasan, CPNS, BUMN, hingga Bank Indonesia.
          </p>
        </div>
        <div className="auth-surface w-full max-w-lg rounded-xl border border-brand-400/20 bg-white p-6 text-slate-900 shadow-command sm:p-8 lg:max-w-xl lg:p-10 xl:p-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
