import { dashboardMenu } from '@/constants/navigation';

export const memberSearchItems = dashboardMenu.flatMap((section) => section.items);

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export function firstNameOf(name?: string | null) {
  const raw = name?.trim() ?? '';
  if (!raw) return 'Member';
  return raw.split(/\s+/)[0] ?? 'Member';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export type WeekDay = {
  key: number;
  date: Date;
  label: string;
  dayNumber: number;
  isToday: boolean;
  done: boolean;
};

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function lastSevenDays(activityDates: string[]) {
  const done = new Set(activityDates.map((value) => startOfDay(new Date(value))));
  const today = new Date();
  const days: WeekDay[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = startOfDay(date);
    days.push({
      key,
      date,
      label: DAY_LABELS[date.getDay()] ?? '',
      dayNumber: date.getDate(),
      isToday: offset === 0,
      done: done.has(key),
    });
  }

  return days;
}

export function consecutiveStreak(activityDates: string[]) {
  const done = new Set(activityDates.map((value) => startOfDay(new Date(value))));
  const today = new Date();
  const todayKey = startOfDay(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  let cursor = done.has(todayKey) ? todayKey : startOfDay(yesterday);
  if (!done.has(cursor)) return 0;

  let count = 0;
  while (done.has(cursor)) {
    count += 1;
    const previous = new Date(cursor);
    previous.setDate(previous.getDate() - 1);
    cursor = startOfDay(previous);
  }
  return count;
}

export function monthCaption(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}
