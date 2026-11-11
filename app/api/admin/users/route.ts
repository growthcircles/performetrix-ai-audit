import { NextRequest, NextResponse } from 'next/server';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminPassword,
  deleteAdminUser,
  setAdminActive,
} from '@/lib/diagnostic/auth';
import { isAdminToken, COOKIE_NAME } from '@/lib/diagnostic/auth';

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isAdminToken(req.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: 'Admin sign in required.' }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;
  try {
    const users = await listAdminUsers();
    return NextResponse.json({ ok: true, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;
  try {
    const body = await req.json();
    const email = body.email;
    const name = body.name;
    const password = body.password;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required.' },
        { status: 400 },
      );
    }

    const user = await createAdminUser(email, name, password);
    if (!user) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;
  try {
    const body = await req.json();
    const id = body.id;
    const password = body.password;
    const active = body.active;

    if (!id) {
      return NextResponse.json({ error: 'Admin id is required.' }, { status: 400 });
    }

    if (password) {
      const ok = await updateAdminPassword(id, password);
      if (!ok) {
        return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
      }
    }

    if (typeof active === 'boolean') {
      const ok = await setAdminActive(id, active);
      if (!ok) {
        return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin id is required.' }, { status: 400 });
    }

    const ok = await deleteAdminUser(id);
    if (!ok) {
      return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}