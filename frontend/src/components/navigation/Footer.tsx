import { Link } from 'react-router-dom';
import { publicNavLinks } from '@/constants/navigation';
import { BrandMark } from '@/components/common/BrandMark';
import { useContactConfig } from '@/hooks/useContactConfig';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';

const paymentMethods = [
  { name: 'QRIS', src: '/payments/qris.webp' },
  { name: 'Bank BNI', src: '/payments/bni.webp' },
  { name: 'Bank NTT', src: '/payments/bank-ntt.png' },
  { name: 'Bank BCA', src: '/payments/bca.svg' },
  { name: 'Bank Nobu', src: '/payments/nobu.png' },
  { name: 'Bank Permata', src: '/payments/permata.webp' },
  { name: 'Bank BRI', src: '/payments/bri.png' },
  { name: 'Bank BTN', src: '/payments/btn.webp' },
] as const;

export function Footer() {
  const theme = useResolvedTheme();
  const { data: contact } = useContactConfig();
  const whatsappNumber = contact?.whatsappPrimary ?? '6281234567890';
  const formattedWhatsApp = whatsappNumber.startsWith('+') ? whatsappNumber : `+${whatsappNumber}`;
  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  const companyAddress = contact?.companyAddress ?? 'Alamat belum diatur';

  return (
    <footer className="mt-16 border-t border-brand-400/15 bg-ink-950/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="min-w-0 shrink-0 lg:w-56 xl:w-64">
          <BrandMark size="lg" variant="icon" forceTheme={theme} />
          <p className="type-body mt-4 text-ink-200">
            Menempa intelektual dan mengunci kelulusan untuk seleksi TNI, Polri, Kedinasan, CPNS, BUMN, Bank Indonesia,
            hingga kepemimpinan politik.
          </p>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="min-w-0">
            <h4 className="type-h2 uppercase tracking-command text-brand-400">Menu</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-200">
              {publicNavLinks.slice(0, 4).map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="transition hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="type-h2 uppercase tracking-command text-brand-400">Disiplin & Integritas</h4>
            <p className="type-body mt-3 text-ink-200">
              Program terstruktur, berstandar tinggi, dan elit — dirancang untuk lulusan yang mengejar institusi
              strategis nasional.
            </p>
          </div>

          <div className="min-w-0">
            <h4 className="type-h2 uppercase tracking-command text-brand-400">Pembayaran</h4>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="payment-logo-card flex h-11 items-center justify-center rounded-lg border border-brand-400/20 p-2"
                  title={method.name}
                >
                  <img src={method.src} alt={method.name} className="h-full w-full object-contain" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="type-h2 uppercase tracking-command text-brand-400">Bantuan</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-200">
              <li>
                <a href={`mailto:${contact?.email ?? 'hallo@atozika.id'}`} className="transition hover:text-brand-300">
                  {contact?.email ?? 'hallo@atozika.id'}
                </a>
              </li>
              <li>
                <a href={whatsappHref} target="_blank" className="font-semibold text-success-500 transition hover:text-success-600" rel="noreferrer">
                  {formattedWhatsApp} (WhatsApp)
                </a>
              </li>
              <li className="type-caption text-ink-200">{companyAddress}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="type-caption border-t border-brand-400/20 py-4 text-center text-ink-200">
        © {new Date().getFullYear()} ATOZIKA. All rights reserved.
      </div>
    </footer>
  );
}
