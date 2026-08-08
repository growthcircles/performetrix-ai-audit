import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { scoreSession, isSessionComplete, type Session } from '@/lib/assessment/scoring';
import { sendReportReadyEmail } from '@/lib/email';

export type LeaderLookup = {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  customerId: string;
  orgName: string;
};

// Uses the service-role client deliberately: there is no session here, the
// token itself is the only credential (an unguessable uuid), matching the
// brief's "one-time link, no login" model.
export async function getLeaderByToken(token: string): Promise<LeaderLookup | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('leaders')
    .select('id, name, status, customer_id, customers(name)')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  const customer = data.customers as unknown as { name: string } | null;
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    customerId: data.customer_id,
    orgName: customer?.name ?? '',
  };
}

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitAssessment(token: string, session: Session): Promise<SubmitResult> {
  const leader = await getLeaderByToken(token);
  if (!leader) return { ok: false, error: 'Invalid link.' };
  if (leader.status === 'completed') {
    return { ok: false, error: 'This assessment has already been submitted.' };
  }

  // Never trust that the client only ever sent what the UI would have
  // produced - re-check completeness before scoring or writing anything.
  if (!isSessionComplete(session)) {
    return { ok: false, error: 'Please complete every question before submitting.' };
  }

  const scores = scoreSession(session);
  const supabase = createServiceClient();

  const { error: insertError } = await supabase.from('submissions').insert({
    leader_id: leader.id,
    raw_answers: session,
    computed_scores: scores,
  });

  if (insertError) {
    // Most likely the unique constraint on leader_id - a concurrent/repeat
    // submission. Either way, the leader-facing message is the same.
    return { ok: false, error: 'This assessment has already been submitted.' };
  }

  const { error: updateError } = await supabase
    .from('leaders')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', leader.id);

  if (updateError) {
    return { ok: false, error: 'Something went wrong saving your submission. Please contact your CHRO.' };
  }

  await notifyChro(leader);

  return { ok: true };
}

// Best-effort notification - never lets an email problem affect the
// submission result the leader already received.
async function notifyChro(leader: LeaderLookup): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { data: chros } = await supabase
      .from('users')
      .select('email')
      .eq('customer_id', leader.customerId)
      .eq('role', 'chro');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const reportUrl = `${appUrl}/reports/${leader.id}`;

    await Promise.all(
      (chros ?? []).map((c) =>
        sendReportReadyEmail({
          to: c.email,
          leaderName: leader.name,
          orgName: leader.orgName,
          reportUrl,
        }),
      ),
    );
  } catch (err) {
    console.error('Failed to notify CHRO of new report:', err);
  }
}
