import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'performetrix-local-dev-secret';

export function adminToken(): string {
  return crypto.createHmac('sha256', SECRET).update('performetrix-admin').digest('hex');
}

export function isAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = adminToken();
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const COOKIE_NAME = 'pfmx_admin';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};
