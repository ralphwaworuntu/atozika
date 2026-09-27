import type { LucideIcon } from 'lucide-react';
import { Activity, HeartPulse, MonitorPlay, Timer } from 'lucide-react';

export type SelectionPillar = {
  number: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon: LucideIcon;
};

export const selectionPillars: SelectionPillar[] = [
  {
    number: '01',
    title: 'Akademik & SKD',
    description: 'Real CAT Engine. Sistem CAT yang dibangun 1:1 dengan CAT real.',
    ctaLabel: 'Coba Demo Mini CAT 5 Soal',
    ctaHref: '/auth/register',
    icon: MonitorPlay,
  },
  {
    number: '02',
    title: 'Psikotes & Kecermatan',
    description: 'Tes Kecermatan dengan real timer dan live scoring. Paling canggih di NTT saat ini.',
    ctaLabel: 'Penjelasan Psikotes POLRI/Kedinasan',
    ctaHref: '/profil',
    icon: Timer,
  },
  {
    number: '03',
    title: 'Jasmani & Fisik',
    description: 'Live Scoring terhubung dengan Mobile Coach Portal. Menampilkan dokumentasi foto/video latihan fisik.',
    ctaLabel: 'Dokumentasi Latihan Fisik Oepoi',
    ctaHref: '/galeri',
    icon: Activity,
  },
  {
    number: '04',
    title: 'Medis & Rikkes',
    description: 'Screening Kesehatan Awal & Decision Support System (DSS) pemicu filter kelulusan.',
    ctaLabel: 'Pemeriksaan Gigi, Mata, BMI & Postur',
    ctaHref: '/profil',
    icon: HeartPulse,
  },
];
