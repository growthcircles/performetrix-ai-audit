import dns from 'node:dns/promises';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'outlook.co.uk', 'live.com', 'msn.com',
  'aol.com', 'aim.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
  'mail.com', 'gmx.com', 'gmx.net', 'gmx.de', 'yandex.com', 'yandex.ru', 'zoho.com',
  'tutanota.com', 'fastmail.com', 'hey.com', 'inbox.com', 'web.de', 'orange.fr',
  'laposte.net', 'rediffmail.com', 'qq.com', '163.com', '126.com', 'naver.com',
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'yopmail.com', 'sharklasers.com',
  'getnada.com', 'maildrop.cc', 'dispostable.com', 'trashmail.com', 'fakeinbox.com',
  'mintemail.com', 'mohmal.com', 'emailondeck.com', 'spamgourmet.com',
]);

export type EmailCheck =
  | { ok: true; email: string }
  | { ok: false; error: string };

// Validates format, rejects personal and disposable domains, and confirms the
// domain can receive mail. Deliberately does not require the user to click a
// link, so it adds no friction to the survey.
export async function validateEmail(raw: string): Promise<EmailCheck> {
  const email = String(raw || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const domain = email.split('@')[1];

  if (PERSONAL_DOMAINS.has(domain)) {
    return { ok: false, error: 'Please use your work email address, not a personal one.' };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, error: 'Please use a permanent work email address.' };
  }

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { ok: false, error: `The domain ${domain} cannot receive email. Check for a typo.` };
    }
  } catch {
    return { ok: false, error: `The domain ${domain} could not be found. Check for a typo.` };
  }

  return { ok: true, email };
}
