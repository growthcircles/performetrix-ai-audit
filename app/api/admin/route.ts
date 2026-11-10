export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/diagnostic/supabase';
import { isAdminToken, COOKIE_NAME } from '@/lib/diagnostic/auth';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminToken(req.cookies.get(COOKIE_NAME)?.value)) {
      return NextResponse.json({ error: 'Admin sign in required.' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('submissions')
      .select(
        `
        id,
        raw_answers,
        computed_scores,
        submitted_at,
        leaders (
          id,
          name,
          customers ( name )
        )
      `,
      )
      .order('submitted_at', { ascending: false });

    if (error) throw new Error(error.message);

    const reports = (data || [])
      .filter((row: any) => Array.isArray(row.computed_scores?.dimensions))
      .map((row: any) => {
      const respondent = row.raw_answers?.__respondent || {};
      const dims = row.computed_scores?.dimensions || [];
      return {
        submissionId: row.leaders?.id,
        name: respondent.name || row.leaders?.name || 'Unknown',
        organisation: respondent.organisation || row.leaders?.customers?.name || 'Unknown',
        email: respondent.email || '',
        emailConfirmed: Boolean(respondent.emailConfirmed),
        submittedAt: row.submitted_at,
        overall: row.computed_scores?.overall ?? null,
        band: row.computed_scores?.band?.name ?? null,
        flagged: dims.filter((d: any) => d.score < 75).map((d: any) => d.name),
      };
    });

    return NextResponse.json({ ok: true, reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

