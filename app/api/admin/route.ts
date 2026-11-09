import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/diagnostic/supabase';
import { isAdminToken, COOKIE_NAME } from '@/lib/diagnostic/auth';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Admin view: list every diagnostic submission
    if (isAdminToken(req.cookies.get(COOKIE_NAME)?.value)) {
      const { data, error } = await supabase
        .from('submissions')
        .select(
          `
          id,
          computed_scores,
          submitted_at,
          leaders (
            id,
            name,
            token,
            customers ( name )
          )
        `,
        )
        .order('submitted_at', { ascending: false });

      if (error) throw new Error(error.message);

      const reports = (data || []).map((row: any) => ({
        submissionId: row.leaders?.id,
        name: row.leaders?.name || 'Unknown',
        organisation: row.leaders?.customers?.name || 'Unknown',
        submittedAt: row.submitted_at,
        overall: row.computed_scores?.overall ?? null,
        band: row.computed_scores?.band?.name ?? null,
        flagged: (row.computed_scores?.dimensions || []).filter((d: any) => d.score <= 80).length,
      }));

      return NextResponse.json({ ok: true, isAdmin: true, reports });
    }

    // CHRO view: own report only
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .select('id, computed_scores, submitted_at, leaders ( id, name, customers ( name ) )')
      .eq('leaders.id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      isAdmin: false,
      submission: submission || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
