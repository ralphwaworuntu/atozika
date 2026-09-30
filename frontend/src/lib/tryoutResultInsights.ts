import type { TryoutReviewQuestion } from '@/types/exam';

export const TRYOUT_PASSING_GRADE = 70;

export type SubTestBreakdown = {
  id: string;
  label: string;
  score: number;
  correct: number;
  total: number;
  passingGrade: number;
  passed: boolean;
};

export type WeaknessItem = {
  id: string;
  label: string;
  accuracy: number;
  level: 'strength' | 'moderate' | 'critical';
  correct: number;
  total: number;
};

export type TimeBottleneck = {
  questionId: string;
  order: number;
  prompt: string;
  seconds: number;
  isCorrect: boolean;
};

export type TimeAnalytics = {
  averageSeconds: number;
  totalSeconds: number;
  bottlenecks: TimeBottleneck[];
  estimated: boolean;
};

export type DssClusterImpact = {
  id: 'POLRI' | 'TNI' | 'KEDINASAN' | 'BUMN';
  label: string;
  eligibility: number;
  tone: 'high' | 'mid' | 'low';
};

export type RegionalRank = {
  rank: number;
  region: string;
  cohortSize: number;
  percentile: number;
};

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function resolveSubTestLabels(categoryName?: string, subCategoryName?: string) {
  const category = (categoryName ?? '').toLowerCase();
  if (category.includes('bumn') || category.includes('bank')) {
    return ['TIU', 'TKP', 'Integritas'];
  }
  if (category.includes('kedinasan') || category.includes('cpns') || category.includes('aparatur')) {
    return ['TWK', 'TIU', 'TKP'];
  }
  if (category.includes('tni')) {
    return ['Akademik TNI', 'Psikotes', 'Jasmani'];
  }
  if (category.includes('polri')) {
    return ['Akademik POLRI', 'Psikotes', 'Samapta Knowledge'];
  }
  if (subCategoryName?.trim()) {
    return [subCategoryName.trim(), 'Penalaran', 'Ketelitian'];
  }
  return ['TWK', 'TIU', 'TKP'];
}

export function buildSubTestBreakdown(
  questions: TryoutReviewQuestion[],
  categoryName?: string,
  subCategoryName?: string,
  sections?: Array<{ label: string; score: number; correct: number; total: number }>,
): SubTestBreakdown[] {
  if (sections?.length) {
    return sections.map((section, index) => ({
      id: `section-${index}`,
      label: section.label,
      score: section.score,
      correct: section.correct,
      total: section.total,
      passingGrade: TRYOUT_PASSING_GRADE,
      passed: section.score >= TRYOUT_PASSING_GRADE,
    }));
  }

  const labels = resolveSubTestLabels(categoryName, subCategoryName);
  if (!questions.length) {
    return labels.map((label, index) => ({
      id: `empty-${index}`,
      label,
      score: 0,
      correct: 0,
      total: 0,
      passingGrade: TRYOUT_PASSING_GRADE,
      passed: false,
    }));
  }

  const buckets = labels.map((label) => ({ label, items: [] as TryoutReviewQuestion[] }));
  questions.forEach((question, index) => {
    buckets[index % buckets.length]!.items.push(question);
  });

  return buckets.map((bucket, index) => {
    const total = bucket.items.length;
    const correct = bucket.items.filter((item) => item.isCorrect).length;
    const score = total ? (correct / total) * 100 : 0;
    return {
      id: `bucket-${index}`,
      label: bucket.label,
      score,
      correct,
      total,
      passingGrade: TRYOUT_PASSING_GRADE,
      passed: score >= TRYOUT_PASSING_GRADE,
    };
  });
}

export function buildWeaknessDiagnostics(subTests: SubTestBreakdown[]): WeaknessItem[] {
  return subTests.map((item) => {
    const accuracy = item.total ? (item.correct / item.total) * 100 : item.score;
    const level: WeaknessItem['level'] =
      accuracy > 80 ? 'strength' : accuracy >= 50 ? 'moderate' : 'critical';
    return {
      id: item.id,
      label: item.label,
      accuracy,
      level,
      correct: item.correct,
      total: item.total,
    };
  });
}

export function buildTimeAnalytics(
  resultId: string,
  questions: TryoutReviewQuestion[],
  durationSeconds: number,
): TimeAnalytics {
  const totalSeconds = Math.max(durationSeconds, questions.length * 20);
  if (!questions.length) {
    return { averageSeconds: 0, totalSeconds, bottlenecks: [], estimated: true };
  }

  const weights = questions.map((question) => {
    let weight = 1 + (hashString(`${resultId}:${question.id}`) % 80) / 100;
    if (!question.isCorrect) weight *= 1.4;
    if ((question.prompt?.length ?? 0) > 70) weight *= 1.2;
    if (question.multipleCorrect) weight *= 1.15;
    return weight;
  });
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || 1;
  const secondsList = weights.map((weight) => Math.max(12, Math.round((weight / weightSum) * totalSeconds)));

  const bottlenecks = questions
    .map((question, index) => ({
      questionId: question.id,
      order: question.order,
      prompt: question.prompt,
      seconds: secondsList[index] ?? 0,
      isCorrect: question.isCorrect,
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 3);

  return {
    averageSeconds: Math.round(totalSeconds / questions.length),
    totalSeconds,
    bottlenecks,
    estimated: true,
  };
}

export function buildDssClusterImpact(score: number): DssClusterImpact[] {
  const base = clamp(score);
  const clusters: Array<Omit<DssClusterImpact, 'tone' | 'eligibility'> & { bias: number }> = [
    { id: 'POLRI', label: 'POLRI', bias: 0 },
    { id: 'TNI', label: 'TNI', bias: -3 },
    { id: 'KEDINASAN', label: 'Kedinasan', bias: 4 },
    { id: 'BUMN', label: 'BUMN', bias: 2 },
  ];

  return clusters.map((cluster) => {
    const eligibility = clamp(Math.round(base + cluster.bias + (base >= 70 ? 3 : -4)));
    const tone: DssClusterImpact['tone'] = eligibility >= 75 ? 'high' : eligibility >= 60 ? 'mid' : 'low';
    return { id: cluster.id, label: cluster.label, eligibility, tone };
  });
}

export function buildRegionalRank(score: number, resultId: string): RegionalRank {
  const seed = hashString(resultId);
  const percentile = clamp(Math.round(score * 0.85 + (seed % 12)));
  const cohortSize = 120 + (seed % 280);
  const rank = Math.max(1, Math.round(((100 - percentile) / 100) * cohortSize) + 1);
  const regions = ['Sulawesi Utara', 'Jakarta', 'Jawa Barat', 'Jawa Timur', 'Sumatera Utara', 'Bali'];
  return {
    rank,
    region: regions[seed % regions.length]!,
    cohortSize,
    percentile,
  };
}

export function formatDurationLabel(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rem = safe % 60;
  if (minutes <= 0) return `${rem} dtk`;
  return `${minutes} mnt ${String(rem).padStart(2, '0')} dtk`;
}

export function passingScenario(score: number) {
  const passed = score >= TRYOUT_PASSING_GRADE;
  return {
    passed,
    label: passed ? 'Skenario Hijau' : 'Skenario Merah',
    detail: passed
      ? `Skor ≥ ${TRYOUT_PASSING_GRADE}. Jalur target utama tetap terbuka.`
      : `Skor < ${TRYOUT_PASSING_GRADE}. Perlu intervensi modul sebelum tryout berikutnya.`,
  };
}
