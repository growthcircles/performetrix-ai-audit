import { createServiceClient } from '@/lib/diagnostic/supabase';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required.' }),
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password.' }), {
        status: 401,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        userId: data.user.id,
        email: data.user.email,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
