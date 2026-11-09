import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'performetrix-local-dev-secret';

export function confirmToken(submissionId: string): string {
  return crypto.createHmac('sha256', SECRET).update(`confirm:${submissionId}`).digest('hex');
}

export function verifyConfirmToken(submissionId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = confirmToken(submissionId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

type SendArgs = { from: string; to: string; subject: string; html: string };

async function send({ from, to, subject, html }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set.' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'assessments@send.growth-circles.com';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendReportEmail({
  to,
  name,
  organisation,
  overall,
  bandName,
  flagged,
  reportUrl,
  confirmUrl,
}: {
  to: string;
  name: string;
  organisation: string;
  overall: number;
  bandName: string;
  flagged: string[];
  reportUrl: string;
  confirmUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
      <h2 style="margin:0 0 8px">Your AI maturity report</h2>
      <p style="margin:0 0 16px;color:#555">${escapeHtml(organisation)}</p>
      <p style="font-size:40px;margin:0 0 4px;color:#8a6d3b"><strong>${overall}</strong><span style="font-size:16px;color:#777"> / 100</span></p>
      <p style="margin:0 0 20px;text-transform:uppercase;letter-spacing:1px;font-size:12px;color:#8a6d3b">${escapeHtml(bandName)}</p>
      ${
        flagged.length
          ? `<p style="margin:0 0 6px"><strong>Priority gaps</strong></p><ul style="margin:0 0 20px 18px;padding:0">${flagged
              .map((f) => `<li style="margin-bottom:4px">${escapeHtml(f)}</li>`)
              .join('')}</ul>`
          : `<p style="margin:0 0 20px">No dimensions were flagged as priority gaps.</p>`
      }
      <p style="margin:0 0 24px">
        <a href="${reportUrl}" style="background:#b4915b;color:#14171f;padding:12px 20px;text-decoration:none;border-radius:2px;font-size:13px;letter-spacing:1px;text-transform:uppercase">View your full report</a>
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:#555">
        If you would like to discuss what these findings mean for ${escapeHtml(organisation)}, reply to this email or book a call.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="font-size:11px;color:#999;margin:0">
        To confirm this email address, <a href="${confirmUrl}" style="color:#8a6d3b">click here</a>.
      </p>
    </div>
  `;

  return send({
    from: fromAddress(),
    to,
    subject: `Your AI maturity report: ${overall}/100 (${bandName})`,
    html,
  });
}

export async function sendAdminNotification({
  name,
  organisation,
  email,
  overall,
  bandName,
  flagged,
  reportUrl,
}: {
  name: string;
  organisation: string;
  email: string;
  overall: number;
  bandName: string;
  flagged: string[];
  reportUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.ADMIN_NOTIFY_EMAIL || 'shiva@growth-circles.com';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
      <h2 style="margin:0 0 12px">New PerforMetrix diagnostic</h2>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:3px 12px 3px 0;color:#777">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#777">Organisation</td><td>${escapeHtml(organisation)}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#777">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#777">Score</td><td><strong>${overall}/100</strong> (${escapeHtml(bandName)})</td></tr>
      </table>
      ${
        flagged.length
          ? `<p style="margin:0 0 6px"><strong>Priority gaps</strong></p><ul style="margin:0 0 16px 18px;padding:0">${flagged
              .map((f) => `<li style="margin-bottom:4px">${escapeHtml(f)}</li>`)
              .join('')}</ul>`
          : `<p style="margin:0 0 16px">No priority gaps flagged.</p>`
      }
      <p style="margin:0"><a href="${reportUrl}" style="color:#8a6d3b">Open the full report</a></p>
    </div>
  `;

  return send({
    from: fromAddress(),
    to,
    subject: `New diagnostic: ${name} (${organisation}) scored ${overall}`,
    html,
  });
}
