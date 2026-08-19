'use server';

import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { logAccess } from '@/lib/data/audit';
import { sendNewSignupNotification } from '@/lib/email';

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
  return `${appUrl}/auth/confirm?token_hash=${tokenHash}&type=invite&next=${encodeURIComponent(next)}`;
}

export async function signup(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const companyName = String(formData.get('companyName') ?? '').trim();

  if (!name || !email || !companyName) {
    redirect(`/signup?error=${encodeURIComponent('Name, work email, and company name are all required.')}`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/signup?error=${encodeURIComponent('Enter a valid email address.')}`);
  }

  const domain = email.split('@')[1];
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    redirect(`/signup?error=${encodeURIComponent('Please sign up with your work email address, not a personal one.')}`);
  }

  const service = createServiceClient();

  const { data: customer, error: customerError } = await service
    .from('customers')
    .insert({ name: companyName })
    .select('id')
    .single();
  if (customerError) throw new Error(customerError.message);

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { role: 'chro', customer_id: customer.id, name },
    },
  });

  if (linkError) {
    // Most likely: an account with this email already exists. Don't leave
    // a dangling, CHRO-less organisation behind from the failed attempt.
    await service.from('customers').delete().eq('id', customer.id);
    redirect(`/signup?error=${encodeURIComponent(linkError.message)}`);
  }

  await logAccess({
    actorId: linkData.user.id,
    action: 'self_signup',
    targetType: 'customer',
    targetId: customer.id,
    detail: `${name} (${email}) for ${companyName}`,
  });

  // Best-effort - a delivery failure shouldn't block the CHRO's own signup.
  await sendNewSignupNotification({ name, email, companyName });

  redirect(buildConfirmUrl(linkData.properties.hashed_token, '/set-password'));
}
