import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/diagnostic/supabase';
import { isAdminToken, COOKIE_NAME } from '@/lib/diagnostic/auth';

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isAdminToken(req.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: 'Admin sign in required.' }, { status: 401 });
  }
  return null;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { id } = await params;
  try {
    const supabase = createServiceClient();

    // Find the submission row(s) for this leader id.
    const { data: submissions, error: listError } = await supabase
      .from('submissions')
      .select('id, leader_id')
      .eq('leader_id', id);

    if (listError) throw new Error(listError.message);

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    // Delete submissions first (they reference leaders), then the leader.
    const submissionIds = submissions.map((s) => s.id);
    const { error: delError } = await supabase.from('submissions').delete().in('id', submissionIds);

    if (delError) throw new Error(delError.message);

    const { error: leaderError } = await supabase.from('leaders').delete().eq('id', id);

    if (leaderError) throw new Error(leaderError.message);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}