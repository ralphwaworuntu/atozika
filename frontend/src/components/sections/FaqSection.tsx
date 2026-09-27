import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionHeader } from '@/components/common/PageHeader';
import { landingFaqs } from '@/constants/faq';
import { cn } from '@/utils/cn';

export function FaqSection() {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(landingFaqs[0]?.id ?? null);

  return (
    <section id="faq" aria-labelledby="faq-title">
      <SectionHeader
        eyebrow="FAQ"
        title="Pertanyaan yang sering diajukan"
        titleClassName="type-hero"
        description="Seputar bimbel ATOZIKA, laporan orang tua, WA Magic Link, dan Garansi Sistem."
      />

      <div className="mt-8 space-y-3">
        {landingFaqs.map((item) => {
          const open = openId === item.id;
          const panelId = `${baseId}-${item.id}-panel`;
          const buttonId = `${baseId}-${item.id}-button`;

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-brand-400/20 dark:bg-[#121a28]"
            >
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-ink-50">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-brand-500 transition-transform duration-200',
                      open && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-brand-400/15 dark:text-ink-200">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
