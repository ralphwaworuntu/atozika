import { z } from 'zod';

export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export const phoneSchema = z
  .string()
  .regex(/^\d+$/, 'Nomor Tlp/WA harus berupa angka saja')
  .min(PHONE_MIN_DIGITS, `Nomor Tlp/WA minimal ${PHONE_MIN_DIGITS} digit`)
  .max(PHONE_MAX_DIGITS, `Nomor Tlp/WA maksimal ${PHONE_MAX_DIGITS} digit`);
