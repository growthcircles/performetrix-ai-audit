import { NextResponse } from 'next/server';
import { verifyAdminPassword, COOKIE_NAME, COOKIE_OPTIONS, adminToken } from '@/lib/diagnostic/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const user = await verifyAdminPassword(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, redirect: '/admin', user });
    res.cookies.set(COOKIE_NAME, adminToken(), COOKIE_OPTIONS);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}