import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const passwordRules = [
  {
    id: 'length',
    label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: 'lower',
    label: 'Huruf kecil (a-z)',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: 'upper',
    label: 'Huruf besar (A-Z)',
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: 'digit',
    label: 'Angka (0-9)',
    test: (value: string) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'Simbol (!@#$%^&* dll.)',
    test: (value: string) => /[^A-Za-z0-9\s]/.test(value),
  },
  {
    id: 'space',
    label: 'Tanpa spasi',
    test: (value: string) => value.length > 0 && !/\s/.test(value),
  },
] as const;

export function passwordIssues(password: string): string[] {
  return passwordRules.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Minimal ${PASSWORD_MIN_LENGTH} karakter`)
  .max(PASSWORD_MAX_LENGTH, `Maksimal ${PASSWORD_MAX_LENGTH} karakter`)
  .superRefine((value, ctx) => {
    const issues = passwordIssues(value);
    if (issues.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Password harus berisi ${issues.join(', ')}`,
      });
    }
  });
