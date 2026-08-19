import 'server-only';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Best-effort: a failed or unconfigured send is logged, never thrown, so a
// leader's submission always succeeds regardless of email delivery.
export async function sendReportReadyEmail({
  to,
  leaderName,
  orgName,
  reportUrl,
}: {
  to: string;
  leaderName: string;
  orgName: string;
  reportUrl: string;
}): Promise<void> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn('Resend not configured - skipping report-ready email.');
    return;
  }

  const safeLeaderName = escapeHtml(leaderName);
  const safeOrgName = escapeHtml(orgName);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: `FutureReady report ready: ${leaderName}`,
      html: `
        <p>A FutureReady readiness report is ready for <strong>${safeLeaderName}</strong> at ${safeOrgName}.</p>
        <p><a href="${reportUrl}">View the report</a></p>
        <p>A copy has also been shared with Shiva Venkateswaran for coaching preparation.</p>
      `,
    });
    if (error) {
      console.error('Resend rejected report-ready email:', error);
    } else {
      console.log('Sent report-ready email', data?.id, 'to', to);
    }
  } catch (err) {
    console.error('Failed to send report-ready email:', err);
  }
}

// CHRO-triggered, not automatic: sent only when the CHRO clicks "send
// report to leader" once the 360 report is ready. Best-effort, matching
// sendReportReadyEmail - a delivery failure shouldn't be silently fatal to
// the calling action, but the caller still surfaces it since this is the
// one channel a leader learns their report exists at all.
export async function sendThreeSixtyReportEmail({
  to,
  leaderName,
  orgName,
  reportUrl,
}: {
  to: string;
  leaderName: string;
  orgName: string;
  reportUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: 'Email is not configured.' };
  }

  const safeLeaderName = escapeHtml(leaderName);
  const safeOrgName = escapeHtml(orgName);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: `Your FutureReady 360 report is ready`,
      html: `
        <p>Hi ${safeLeaderName},</p>
        <p>Your FutureReady 360 report is ready, gathering input from your manager, peers, and direct reports at ${safeOrgName} alongside your own self-assessment.</p>
        <p><a href="${reportUrl}">View your report</a></p>
        <p>This is a private link intended only for you.</p>
      `,
    });
    if (error) {
      console.error('Resend rejected 360 report email:', error);
      return { ok: false, error: error.message };
    }
    console.log('Sent 360 report email', data?.id, 'to', to);
    return { ok: true };
  } catch (err) {
    console.error('Failed to send 360 report email:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Fires on every self-service signup, purely informational - Shiva's
// follow-up strategy is watching for engagement after the fact, not
// gatekeeping before it, so a delivery failure here is logged but never
// blocks the signup itself (same best-effort shape as sendReportReadyEmail).
export async function sendNewSignupNotification({
  name,
  email,
  companyName,
}: {
  name: string;
  email: string;
  companyName: string;
}): Promise<void> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn('Resend not configured - skipping new-signup notification email.');
    return;
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompanyName = escapeHtml(companyName);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'shiva@growth-circles.com',
      subject: `New FutureReady signup: ${companyName}`,
      html: `
        <p>A new organisation signed up through the self-service form.</p>
        <p>
          <strong>Company:</strong> ${safeCompanyName}<br>
          <strong>CHRO:</strong> ${safeName}<br>
          <strong>Work email:</strong> ${safeEmail}
        </p>
      `,
    });
    if (error) {
      console.error('Resend rejected new-signup notification email:', error);
    } else {
      console.log('Sent new-signup notification email', data?.id);
    }
  } catch (err) {
    console.error('Failed to send new-signup notification email:', err);
  }
}

// Unlike sendReportReadyEmail, this is the ONLY way a new CHRO learns their
// account exists - a silent failure here means an invite that never
// arrives, so this reports success/failure back to the caller instead of
// swallowing it.
export async function sendChroInviteEmail({
  to,
  name,
  orgName,
  inviteUrl,
}: {
  to: string;
  name: string;
  orgName: string;
  inviteUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: 'Email is not configured.' };
  }

  const safeName = escapeHtml(name);
  const safeOrgName = escapeHtml(orgName);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: `You've been added to FutureReady - ${orgName}`,
      html: `
        <p>Hi ${safeName},</p>
        <p>You've been set up as the FutureReady admin for <strong>${safeOrgName}</strong>.</p>
        <p><a href="${inviteUrl}">Set your password to get started</a></p>
        <p>This link is only valid for a limited time and can only be used once.</p>
      `,
    });
    if (error) {
      console.error('Resend rejected CHRO invite email:', error);
      return { ok: false, error: error.message };
    }
    console.log('Sent CHRO invite email', data?.id, 'to', to);
    return { ok: true };
  } catch (err) {
    console.error('Failed to send CHRO invite email:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
