// One-off admin utility: creates a CHRO or super_admin login directly via
// the Supabase Admin API (password auth, email pre-confirmed). Account
// creation isn't self-serve in this app, so this script is how accounts
// get provisioned instead of a signup form.
//
// Usage:
//   node --env-file=.env.local scripts/provision-user.mjs <email> <password> <role> [name] [customerId]
//
//   role is "super_admin" or "chro". "chro" requires a customerId
//   (the customers.id row for that organisation must already exist).

import { createClient } from '@supabase/supabase-js';

const [, , email, password, role, name, customerId] = process.argv;

if (!email || !password || !role) {
  console.error(
    'Usage: node --env-file=.env.local scripts/provision-user.mjs <email> <password> <super_admin|chro> [name] [customerId]',
  );
  process.exit(1);
}

if (role !== 'super_admin' && role !== 'chro') {
  console.error('role must be "super_admin" or "chro"');
  process.exit(1);
}

if (role === 'chro' && !customerId) {
  console.error('chro accounts require a customerId argument');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error(
    'Missing env vars - run with --env-file=.env.local so NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY are set.',
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    role,
    name: name || email,
    customer_id: role === 'chro' ? customerId : null,
  },
});

if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}

console.log(`Created ${role} account for ${email} (id: ${data.user.id})`);
