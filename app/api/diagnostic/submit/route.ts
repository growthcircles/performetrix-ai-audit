export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/diagnostic/supabase';
import { DIMENSION_ORDER, DIMENSIONS, bandForScore } from '@/lib/diagnostic/data';
import { validateEmail } from '@/lib/diagnostic/email-validation';
import { sendReportEmail, sendAdminNotification, confirmToken } from '@/lib/diagnostic/email';
import { renderReportPdf } from '@/lib/diagnostic/pdf';

function normalize(mean: number): number {
  return Math.round(((mean - 1) / 4) * 100);
}

async function customerIdFor(supabase: any, organisation: string): Promise<string> {
  const clean = organisation.trim();
  const { data: existing, error } = await supabase.from('customers').select('id, name');
  if (error) throw new Error(error.message);

  const match = (existing || []).find(
    (c: any) => String(c.name).trim().toLowerCase() === clean.toLowerCase(),
  );
  if (match) return match.id;

  const { data: created, error: createError } = await supabase
    .from('customers')
    .insert({ name: clean })
    .select('id')
    .single();
  if (createError) throw new Error(createError.message);
  return created.id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const organisation = String(body?.organisation || '').trim();
    const answers: Record<string, number> = body?.answers || {};

    if (!name || !organisation) {
      return NextResponse.json(
        { error: 'Please enter your name and organisation.' },
        { status: 400 },
      );
    }

    const emailCheck = await validateEmail(body?.email);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }
    const email = emailCheck.email;

    const missing: string[] = [];
    DIMENSION_ORDER.forEach((key) => {
      const dim = DIMENSIONS.find((d) => d.key === key)!;
      dim.questions.forEach((q) => {
        const v = answers[q.key];
        if (!(typeof v === 'number' && v >= 1 && v <= 5)) missing.push(q.key);
      });
    });
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Please answer all 15 questions before submitting.' },
        { status: 400 },
      );
    }

    const dimensions = DIMENSION_ORDER.map((key) => {
      const dim = DIMENSIONS.find((d) => d.key === key)!;
      const values = dim.questions.map((q) => answers[q.key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const score = normalize(mean);
      return { key, name: dim.name, score, band: bandForScore(score) };
    });

    const overall = Math.round(dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length);
    const band = bandForScore(overall);

    const supabase = createServiceClient();
    const customerId = await customerIdFor(supabase, organisation);

    const { data: leader, error: leaderError } = await supabase
      .from('leaders')
      .insert({
        customer_id: customerId,
        name,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (leaderError) throw new Error(leaderError.message);

    const respondent = {
      name,
      organisation,
      email,
      emailConfirmed: false,
      emailConfirmedAt: null as string | null,
    };

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        leader_id: leader.id,
        raw_answers: { ...answers, __respondent: respondent },
        computed_scores: { overall, dimensions, band },
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (submissionError) throw new Error(submissionError.message);

    // Email is best effort. The report is already available on screen.
    const origin = req.nextUrl.origin;
    const reportUrl = `${origin}/diagnostic/report/${leader.id}`;
    const confirmUrl = `${origin}/api/confirm?sid=${submission.id}&t=${confirmToken(submission.id)}`;
    const flagged = dimensions.filter((d) => d.score <= 80).map((d) => d.name);

    const dateLabel = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    let attachment: { filename: string; content: string } | undefined;
    try {
      const pdf = await renderReportPdf({
        name,
        organisation,
        dateLabel,
        overall,
        band: { key: band.key, name: band.name, rangeLabel: band.rangeLabel, description: band.description },
        dimensions: dimensions.map((d) => ({ key: d.key, name: d.name, score: d.score })),
      });
      const safeOrg = organisation.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      attachment = {
        filename: `PerforMetrix-${safeOrg}-report.pdf`,
        content: pdf.toString('base64'),
      };
    } catch (pdfError) {
      console.error('PDF generation failed', pdfError);
    }

    const reportEmail = await sendReportEmail({
      to: email,
      name,
      organisation,
      overall,
      bandName: band.name,
      reportUrl,
      confirmUrl,
      attachment,
    });

    const adminEmail = await sendAdminNotification({
      name,
      organisation,
      email,
      overall,
      bandName: band.name,
      flagged,
      reportUrl,
    });

    return NextResponse.json({
      ok: true,
      submissionId: leader.id,
      emailSent: reportEmail.ok,
      emailError: reportEmail.ok ? undefined : reportEmail.error,
      adminNotified: adminEmail.ok,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

