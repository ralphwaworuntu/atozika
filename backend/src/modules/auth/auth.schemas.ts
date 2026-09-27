import { z } from 'zod';
import { validatePasswordStrength } from '../../utils/password';

const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;

const phone = z
  .string()
  .regex(/^\d+$/, 'Nomor Tlp/WA harus berupa angka saja')
  .min(PHONE_MIN_DIGITS, `Nomor Tlp/WA minimal ${PHONE_MIN_DIGITS} digit`)
  .max(PHONE_MAX_DIGITS, `Nomor Tlp/WA maksimal ${PHONE_MAX_DIGITS} digit`);

const strongPassword = z.string().superRefine((value, ctx) => {
  const issue = validatePasswordStrength(value);
  if (issue) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue });
  }
});

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(3),
      email: z.string().email(),
      password: strongPassword,
      confirmPassword: z.string().min(1),
      phone: phone,
      referralCode: z.string().optional(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: 'Konfirmasi password tidak sama',
      path: ['confirmPassword'],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    phone: phone.optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    nationalId: z.string().min(6).optional(),
    address: z.string().min(5).optional(),
    heightCm: z.coerce.number().int().positive().optional(),
    weightKg: z.coerce.number().int().positive().optional(),
    parentName: z.string().min(3).optional(),
    parentPhone: phone.optional(),
    parentOccupation: z.string().min(2).optional(),
    parentAddress: z.string().min(5).optional(),
    healthIssues: z.string().min(3).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword,
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
