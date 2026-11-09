import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/diagnostic/auth';

function clear(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  res.cookies.set('pfmx_user', '', { path: '/', maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  return clear(NextResponse.redirect(new URL('/login', req.nextUrl.origin)));
}

export async function POST() {
  return clear(NextResponse.json({ ok: true }));
}
