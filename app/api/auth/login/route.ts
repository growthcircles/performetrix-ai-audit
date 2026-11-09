import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/diagnostic/supabase';
import { adminToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/diagnostic/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Admin login (environment credentials)
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (adminEmail && adminPassword && cleanEmail === adminEmail && password === adminPassword) {
      const res = NextResponse.json({ ok: true, isAdmin: true, redirect: '/admin' });
      res.cookies.set(COOKIE_NAME, adminToken(), COOKIE_OPTIONS);
      return res;
    }

    // 2. CHRO login (Supabase Auth)
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const res = NextResponse.json({
      ok: true,
      isAdmin: false,
      userId: data.user.id,
      email: data.user.email,
      redirect: '/diagnostic',
    });
    res.cookies.set('pfmx_user', data.user.id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
