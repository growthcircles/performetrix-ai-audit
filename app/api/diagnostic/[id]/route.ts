import { createServiceClient } from '@/lib/diagnostic/supabase';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServiceClient();

    const { data: submission, error } = await supabase
      .from('submissions')
      .select(
        `
        id,
        raw_answers,
        computed_scores,
        submitted_at,
        leaders (
          id,
          name,
          customers ( id, name )
        )
      `,
      )
      .eq('leaders.id', params.id)
      .maybeSingle();

    if (error || !submission) {
      return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        submission: {
          id: submission.id,
          leaderName: submission.leaders.name,
          orgName: submission.leaders.customers.name,
          scores: submission.computed_scores,
          submittedAt: submission.submitted_at,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
