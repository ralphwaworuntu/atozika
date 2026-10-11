export type LearningTopic = {
  key: string;
  name: string;
  icon: string;
  tint: string;
  bar: string;
  practice: { soal: number; paket: number; description: string; groups: string[] };
  material: { count: number; progress: number };
};

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    key: 'TNI',
    name: 'TNI',
    icon: '/illustrations/icon-tni.jpg',
    tint: 'from-emerald-100 to-emerald-50/40',
    bar: 'bg-blue-600',
    practice: { soal: 820, paket: 8, description: 'Latihan soal seleksi TNI dengan pembahasan lengkap.', groups: ['TNI'] },
    material: { count: 32, progress: 68 },
  },
  {
    key: 'POLRI',
    name: 'POLRI',
    icon: '/illustrations/icon-polri.jpg',
    tint: 'from-rose-100 to-rose-50/40',
    bar: 'bg-blue-600',
    practice: { soal: 280, paket: 7, description: 'Latihan soal seleksi POLRI dengan pembahasan lengkap.', groups: ['POLRI'] },
    material: { count: 28, progress: 52 },
  },
  {
    key: 'Kedinasan',
    name: 'Kedinasan',
    icon: '/illustrations/icon-kedinasan.jpg',
    tint: 'from-violet-100 to-violet-50/40',
    bar: 'bg-blue-600',
    practice: { soal: 420, paket: 10, description: 'Latihan soal seleksi kedinasan (IPDN, STAN, dll).', groups: ['Kedinasan'] },
    material: { count: 45, progress: 40 },
  },
  {
    key: 'BUMN',
    name: 'BUMN',
    icon: '/illustrations/icon-bumn.jpg',
    tint: 'from-amber-100 to-amber-50/40',
    bar: 'bg-amber-600',
    practice: { soal: 228, paket: 6, description: 'Latihan soal seleksi BUMN dengan pembahasan lengkap.', groups: ['BUMN'] },
    material: { count: 26, progress: 36 },
  },
  {
    key: 'Umum',
    name: 'Umum',
    icon: '/covers/cover-notes.jpg',
    tint: 'from-sky-100 to-sky-50/40',
    bar: 'bg-sky-600',
    practice: { soal: 160, paket: 4, description: 'Latihan soal umum untuk semua jalur seleksi.', groups: ['Umum'] },
    material: { count: 16, progress: 24 },
  },
  {
    key: 'TWK',
    name: 'TWK',
    icon: '/illustrations/icon-twk.jpg',
    tint: 'from-blue-100 to-blue-50/40',
    bar: 'bg-blue-600',
    practice: { soal: 120, paket: 4, description: 'Wawasan Kebangsaan, Pancasila, UUD 1945, dan NKRI.', groups: ['Kedinasan', 'BUMN'] },
    material: { count: 18, progress: 72 },
  },
  {
    key: 'TIU',
    name: 'TIU',
    icon: '/illustrations/icon-tiu.jpg',
    tint: 'from-teal-100 to-teal-50/40',
    bar: 'bg-emerald-600',
    practice: { soal: 150, paket: 5, description: 'Kemampuan numerik, logika, analisis, dan penalaran.', groups: ['Kedinasan', 'BUMN'] },
    material: { count: 22, progress: 58 },
  },
  {
    key: 'TKP',
    name: 'TKP',
    icon: '/illustrations/icon-tkp.jpg',
    tint: 'from-rose-100 to-rose-50/40',
    bar: 'bg-rose-600',
    practice: { soal: 150, paket: 5, description: 'Karakter dan sikap kerja dalam situasi nyata.', groups: ['Kedinasan', 'BUMN'] },
    material: { count: 20, progress: 46 },
  },
  {
    key: 'Tes Kecermatan',
    name: 'Tes Kecermatan',
    icon: '/illustrations/icon-kecermatan.jpg',
    tint: 'from-amber-100 to-amber-50/40',
    bar: 'bg-amber-600',
    practice: { soal: 200, paket: 5, description: 'Melatih ketelitian, konsentrasi, dan kecepatan.', groups: ['TNI', 'POLRI'] },
    material: { count: 25, progress: 30 },
  },
];

export function topicByName(name?: string | null) {
  const value = (name ?? '').trim().toLowerCase();
  if (!value) return undefined;
  return LEARNING_TOPICS.find((topic) => value === topic.key.toLowerCase() || value.includes(topic.key.toLowerCase()));
}
