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
