import crypto from 'crypto';
import { createServiceClient } from '@/lib/diagnostic/supabase';

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

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
};

function hashPassword(password: string): string {
  return crypto.createHmac('sha256', SECRET).update(`admin:${password}`).digest('hex');
}

export async function verifyAdminPassword(email: string, password: string): Promise<AdminUser | null> {
  const supabase = createServiceClient();

  // First try the database-backed admin users table.
  const { data: users, error } = await supabase
    .from('admin_users')
    .select('id, email, name, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  if (!error && users) {
    const expected = hashPassword(password);
    if (users.password_hash && users.password_hash.length === expected.length) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(users.password_hash), Buffer.from(expected))) {
          return {
            id: users.id,
            email: users.email,
            name: users.name,
            is_active: users.is_active,
            created_at: null,
          };
        }
      } catch {
        // fall through
      }
    }
  }

  // Fallback to env credentials for the first admin (seeding path).
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (
    !adminEmail ||
    !adminPassword ||
    email.toLowerCase().trim() !== adminEmail ||
    password !== adminPassword
  ) {
    return null;
  }

  return {
    id: 'env-admin',
    email: adminEmail,
    name: process.env.ADMIN_NAME || 'PerforMetrix Admin',
    is_active: true,
    created_at: null,
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, name, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    is_active: u.is_active,
    created_at: u.created_at ?? null,
  }));
}

export async function createAdminUser(email: string, name: string, password: string): Promise<AdminUser | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: email.toLowerCase().trim(),
      name,
      password_hash: hashPassword(password),
      is_active: true,
    })
    .select('id, email, name, is_active, created_at')
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    is_active: data.is_active,
    created_at: data.created_at ?? null,
  };
}

export async function updateAdminPassword(id: string, password: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: hashPassword(password), updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('admin_users').delete().eq('id', id);
  return !error;
}

export async function setAdminActive(id: string, active: boolean): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('admin_users')
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}
