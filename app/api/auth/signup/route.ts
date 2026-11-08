import { createServiceClient } from '@/lib/diagnostic/supabase';
import { DIMENSION_ORDER, DIMENSIONS, bandForScore } from '@/lib/diagnostic/data';

function normalize(score: number): number {
  return Math.round(((score - 1) / 4) * 100);
}

export async function POST(req: Request) {
  try {
    const { name, organisation, email, password, answers } = await req.json();

    if (!name || !organisation || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, organisation, email, and password are required.' }),
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // 1. Create a customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({ name: organisation })
      .select('id')
      .single();

    if (customerError) throw new Error(customerError.message);

    // 2. Create Supabase Auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        role: 'chro',
        customer_id: customer.id,
        name,
      },
    });

    if (authError) {
      // Clean up customer if auth fails
      await supabase.from('customers').delete().eq('id', customer.id);
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
    }

    // 3. Score the diagnostic
    const scores: Array<{
      key: string;
      name: string;
      score: number;
      band: { key: string; name: string; rangeLabel: string; description: string };
    }> = [];

    DIMENSION_ORDER.forEach((key) => {
      const dim = DIMENSIONS.find((d) => d.key === key)!;
      const values = dim.questions.map((q) => answers[q.key]).filter(
        (v): v is number => typeof v === 'number' && v >= 1 && v <= 5,
      );
      const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const normalized = normalize(mean);
      const band = bandForScore(normalized);
      scores.push({ key, name: dim.name, score: normalized, band });
    });

    const overall = Math.round(
      scores.reduce((a, s) => a + s.score, 0) / scores.length,
    );
    const overallBand = bandForScore(overall);

    // 4. Create a leader and submission
    const { data: leader, error: leaderError } = await supabase
      .from('leaders')
      .insert({
        customer_id: customer.id,
        name,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (leaderError) throw new Error(leaderError.message);

    const { error: submissionError } = await supabase
      .from('submissions')
      .insert({
        leader_id: leader.id,
        raw_answers: answers,
        computed_scores: {
          overall,
          dimensions: scores,
          band: overallBand,
        },
        submitted_at: new Date().toISOString(),
      });

    if (submissionError) throw new Error(submissionError.message);

    return new Response(
      JSON.stringify({
        ok: true,
        userId: authData.user.id,
        submissionId: leader.id,
        overall,
        band: overallBand,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
