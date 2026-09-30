export type CermatMode = 'NUMBER' | 'LETTER' | 'IMAGE';

export type CermatModesConfig = {
  imageEnabled: boolean;
  letterEnabled: boolean;
  numberEnabled: boolean;
};

export type CermatConfig = {
  questionCount: number;
  durationSeconds: number;
  totalSessions: number;
  breakSeconds: number;
  modes?: CermatModesConfig;
};

export const DEFAULT_CERMAT_CONFIG: CermatConfig = {
  questionCount: 60,
  durationSeconds: 60,
  totalSessions: 10,
  breakSeconds: 5,
  modes: {
    imageEnabled: true,
    letterEnabled: true,
    numberEnabled: true,
  },
};

export function formatCermatConfigSummary(config: CermatConfig): string {
  const breakSeconds = config.breakSeconds ?? 5;
  return `${config.totalSessions} sesi · ${config.questionCount} soal · ${config.durationSeconds} detik · jeda ${breakSeconds} detik`;
}

export const CERMAT_MODE_LABELS: Record<CermatMode, string> = {
  NUMBER: 'Angka Hilang',
  LETTER: 'Huruf Hilang',
  IMAGE: 'Gambar Hilang',
};
