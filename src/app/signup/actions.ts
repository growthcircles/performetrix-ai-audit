'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { logAccess } from '@/lib/data/audit';
import { sendNewSignupNotification, sendVerifyEmailAddress } from '@/lib/email';

// Common free/personal webmail providers - a work-email signal, not a
// security boundary. Blocklist rather than allowlist, since an allowlist
// of "real" company domains would be impossible to maintain and would
// reject legitimate companies.
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'outlook.co.uk', 'live.com', 'msn.com',
  'aol.com', 'aim.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'mail.com', 'gmx.com', 'gmx.net', 'gmx.de',
  'yandex.com', 'yandex.ru',
  'zoho.com', 'tutanota.com', 'fastmail.com', 'hey.com', 'inbox.com',
  'web.de', 'orange.fr', 'laposte.net',
  'rediffmail.com', 'qq.com', '163.com', '126.com', 'naver.com',
]);

function buildConfirmUrl(tokenHash: string, next: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return `${appUrl}/auth/confirm?token_hash=${tokenHash}&type=signup&next=${encodeURIComponent(next)}`;
}

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string };

// On success, this does NOT hand back a confirmUrl to auto-navigate to -
// unlike the old passwordless 'invite' flow, the whole point here is that
// clicking the emailed link is what proves the CHRO actually owns this
// address, so the browser has to wait for a real click, not fast-forward
// past it. /auth/confirm (unchanged) verifies the token and, in the same
// call, establishes the session - so clicking the link both confirms the
// email and signs the CHRO straight into /chro, no separate step.
export async function signup(formData: FormData): Promise<SignupResult> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const companyName = String(formData.get('companyName') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!name || !email || !companyName) {
    return { ok: false, error: 'Name, work email, and company name are all required.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const domain = email.split('@')[1];
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, error: 'Please sign up with your work email address, not a personal one.' };
  }

  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirm) {
    return { ok: false, error: 'Passwords do not match.' };
  }

  const service = createServiceClient();

  const { data: customer, error: customerError } = await service
    .from('customers')
    .insert({ name: companyName })
    .select('id')
    .single();
  if (customerError) throw new Error(customerError.message);

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      data: { role: 'chro', customer_id: customer.id, name },
    },
  });

  if (linkError) {
    // Most likely: an account with this email already exists. Don't leave
    // a dangling, CHRO-less organisation behind from the failed attempt.
    await service.from('customers').delete().eq('id', customer.id);
    return { ok: false, error: linkError.message };
  }

  await logAccess({
    actorId: linkData.user.id,
    action: 'self_signup',
    targetType: 'customer',
    targetId: customer.id,
    detail: `${name} (${email}) for ${companyName}`,
  });

  const confirmUrl = buildConfirmUrl(linkData.properties.hashed_token, '/');

  const verifyResult = await sendVerifyEmailAddress({ to: email, name, confirmUrl });
  if (!verifyResult.ok) {
    // The org and auth user already exist at this point - surfacing the
    // email failure lets the CHRO know to contact support rather than
    // wonder why nothing ever arrives, without rolling back real state.
    return { ok: false, error: `Account created, but the verification email couldn't be sent: ${verifyResult.error}` };
  }

  // Best-effort - fires on org creation regardless of verification status,
  // a delivery failure shouldn't block the CHRO's own signup.
  await sendNewSignupNotification({ name, email, companyName });

  return { ok: true };
}
