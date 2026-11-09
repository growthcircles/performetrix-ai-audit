import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/diagnostic/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  res.cookies.set('pfmx_user', '', { path: '/', maxAge: 0 });
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  res.cookies.set('pfmx_user', '', { path: '/', maxAge: 0 });
  return res;
}
