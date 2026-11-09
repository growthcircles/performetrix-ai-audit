export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/diagnostic/supabase';
import { verifyConfirmToken } from '@/lib/diagnostic/email';

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get('sid');
  const token = req.nextUrl.searchParams.get('t');

  if (!sid || !verifyConfirmToken(sid, token)) {
    return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: submission, error } = await supabase
    .from('submissions')
    .select('id, leader_id, raw_answers')
    .eq('id', sid)
    .maybeSingle();

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  const raw: any = submission.raw_answers || {};
  const respondent = raw.__respondent || {};
  const updated = {
    ...raw,
    __respondent: {
      ...respondent,
      emailConfirmed: true,
      emailConfirmedAt: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase
    .from('submissions')
    .update({ raw_answers: updated })
    .eq('id', sid);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL(`/diagnostic/report/${submission.leader_id}`, req.nextUrl.origin),
  );
}
