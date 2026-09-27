import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

export function validatePasswordStrength(password: string): string | null {
  if (!password || password.trim() === '') return 'Password wajib diisi';
  if (password.length < PASSWORD_MIN_LENGTH) return `Password minimal ${PASSWORD_MIN_LENGTH} karakter`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Password maksimal ${PASSWORD_MAX_LENGTH} karakter`;
  if (/\s/.test(password)) return 'Password tidak boleh mengandung spasi';

  const missing: string[] = [];
  if (!/[a-z]/.test(password)) missing.push('huruf kecil');
  if (!/[A-Z]/.test(password)) missing.push('huruf besar');
  if (!/\d/.test(password)) missing.push('angka');
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('simbol');
  if (missing.length) return `Password harus berisi ${missing.join(', ')}`;
  return null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
