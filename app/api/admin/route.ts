import { createServiceClient } from '@/lib/diagnostic/supabase';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    const supabase = createServiceClient();

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select(`
        id,
        raw_answers,
        computed_scores,
        submitted_at,
        leaders!inner ( id, name, customer_id )
      `)
      .eq('leader_id', user.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          customer_id: user.customer_id,
        },
        submission: submission || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}