export function ParentMagicLink() {
  return (
    <section aria-labelledby="parent-magic-link-title">
      <div className="grid items-center gap-8 rounded-xl border border-brand-400/25 bg-ink-800 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">Fitur Orang Tua</p>
          <h2 id="parent-magic-link-title" className="type-hero mt-3 text-ink-50">
            Parent WA Magic Link
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
            Orang Tua <span className="font-semibold text-ink-50">&quot;Tidak Perlu&quot;</span> repot login/ingat
            password. Rapor bulanan (skor CAT, nilai lari, & absensi) dikirim otomatis langsung ke WhatsApp Orang Tua.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-200">
            Pesan berisi grafik perkembangan anak, sehingga sponsor/ortu mendapat tingkat kepercayaan tinggi tanpa
            membuka dashboard.
          </p>
        </div>

        <aside className="rounded-2xl border border-success-600 bg-success-50 p-5 shadow-[0_8px_24px_rgba(47,133,90,0.14)] sm:p-6 dark:border-success-400/45 dark:bg-[#070b12]/70 dark:shadow-[0_0_40px_rgba(16,185,129,0.12)]">
          <p className="flex items-center gap-2 text-sm font-semibold text-success-800 dark:text-success-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="h-4 w-4"
              fill="#25D366"
              aria-hidden
            >
              <path d="M16.04 5c-5.5 0-9.96 4.46-9.96 9.97 0 1.84.51 3.63 1.47 5.2L5 27l6.98-2.17c1.5.82 3.19 1.25 4.94 1.25 5.5 0 9.98-4.47 9.98-9.98C26.9 9.46 21.53 5 16.04 5zm5.74 14.3c-.24.68-1.38 1.31-1.9 1.34-.53.03-1.02.33-3.46-.71-2.93-1.28-4.8-4.4-4.95-4.6-.14-.2-1.17-1.55-1.17-2.95 0-1.4.74-2.08 1-2.36.27-.29.59-.36.78-.36h.56c.18 0 .42-.03.64.48.24.58.81 1.99.88 2.13.07.14.12.3.02.48-.1.19-.15.3-.3.46-.15.17-.31.37-.45.5-.15.14-.3.29-.13.58.17.29.75 1.24 1.61 2 1.11.98 2.04 1.28 2.33 1.43.3.14.48.12.65-.07.16-.18.74-.86.94-1.15.2-.29.4-.24.67-.15.27.1 1.73.81 2.03.96.3.15.5.22.58.34.08.12.08.69-.16 1.37z" />
            </svg>
            WhatsApp Report
          </p>
          <p className="mt-3 text-sm leading-relaxed text-success-900 dark:text-success-100/90">
            “Halo Bapak/Ibu, berikut ringkasan Rapor Diagnostik ATOZIKA an. Yohanes: CAT SKD (410), Lari Oepoi (6.5
            Putaran), Kehadiran (100%).”
          </p>
        </aside>
      </div>
    </section>
  );
}
