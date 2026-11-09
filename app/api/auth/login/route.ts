import { NextResponse } from 'next/server';
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
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin login is not configured on this deployment.' },
        { status: 500 },
      );
    }

    if (cleanEmail !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, redirect: '/admin' });
    res.cookies.set(COOKIE_NAME, adminToken(), COOKIE_OPTIONS);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
