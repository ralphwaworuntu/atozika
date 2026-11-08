import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { SectionHeader } from '@/components/common/PageHeader';
import { apiGet } from '@/lib/api';
import { landingFaqs } from '@/constants/faq';
import type { HomeCopy } from '@/types/siteContent';
import { cn } from '@/utils/cn';

type FaqItem = { id: string; question: string; answer: string };

export function FaqSection({ header }: { header?: HomeCopy['faq'] }) {
  const baseId = useId();
  const query = useQuery({ queryKey: ['landing-faq'], queryFn: () => apiGet<FaqItem[]>('/landing/faq') });
  const items = query.data?.length ? query.data : landingFaqs;
  const [openId, setOpenId] = useState<string | null>(null);
  const activeId = openId ?? items[0]?.id ?? null;

  return (
    <section id="faq" aria-labelledby="faq-title">
      <SectionHeader
        eyebrow={header?.eyebrow || 'FAQ'}
        title={header?.title || 'Pertanyaan yang sering diajukan'}
        titleClassName="type-hero"
        description={header?.description || 'Seputar bimbel ATOZIKA, laporan orang tua, WA Magic Link, dan Garansi Sistem.'}
      />

      <div className="mt-8 space-y-3">
        {items.map((item) => {
          const open = activeId === item.id;
          const panelId = `${baseId}-${item.id}-panel`;
          const buttonId = `${baseId}-${item.id}-button`;
          return (
            <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-brand-400/20 dark:bg-[#121a28]">
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenId((prev) => ((prev ?? items[0]?.id) === item.id ? '' : item.id))}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-ink-50">{item.question}</span>
                  <ChevronDown className={cn('h-5 w-5 shrink-0 text-brand-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={buttonId} className={cn('grid transition-[grid-template-rows] duration-200 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                  <p className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-brand-400/15 dark:text-ink-200">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 ? <p className="text-sm text-ink-200">Belum ada pertanyaan.</p> : null}
      </div>
    </section>
  );
}
