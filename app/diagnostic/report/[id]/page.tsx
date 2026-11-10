import { createServiceClient } from '@/lib/diagnostic/supabase';
import {
  DIMENSION_IMPACT,
  MATURITY_BANDS,
  bandForScore,
  colorForScore,
  impactTierForScore,
} from '@/lib/diagnostic/data';
import { buildCta } from '@/lib/diagnostic/cta';

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        name,
        customers ( name )
      )
    `,
    )
    .eq('leader_id', id)
    .maybeSingle();

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body flex flex-col items-center justify-center p-6">
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-8">
          <div className="text-xl font-display mb-2">Report not found</div>
          <p className="text-[#E8E4DA] opacity-75">The report you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const scores = submission.computed_scores as any;
  const dimensions: any[] = Array.isArray(scores?.dimensions) ? scores.dimensions : [];

  // Only PerforMetrix submissions carry a dimensions array. Anything else
  // (for example an old FutureReady record sharing the same database) must not
  // be rendered with this instrument's layout.
  if (dimensions.length === 0) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body flex flex-col items-center justify-center p-6">
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-8 max-w-md">
          <div className="text-xl font-display mb-2">Not a PerforMetrix report</div>
          <p className="text-sm opacity-70">
            This record was created by a different assessment. PerforMetrix reports are
            generated from the 15-question performance review diagnostic.
          </p>
          <a href="/diagnostic" className="inline-block mt-4 text-[#D8BE8F] hover:underline">
            Take the diagnostic
          </a>
        </div>
      </div>
    );
  }

  const overall = scores.overall ?? 0;
  const band = scores.band || bandForScore(overall);

  const raw = (submission.raw_answers || {}) as any;
  const respondent = raw.__respondent || {};
  const displayName = respondent.name || submission.leaders.name;
  const displayOrg =
    respondent.organisation || submission.leaders.customers?.name || 'Unknown';

  const call = buildCta({ organisation: displayOrg, dimensions });

  const sorted = [...dimensions].sort((a: any, b: any) => a.score - b.score);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const gap = highest.score - lowest.score;
  const gain = (gap / 5).toFixed(1);
  const lowestBand = bandForScore(lowest.score);
  const highestBand = bandForScore(highest.score);

  const colour = (c: string) =>
    c === 'red'
      ? { text: 'text-[#B65C3F]', border: 'border-[#B65C3F]', dot: 'bg-[#B65C3F]', stroke: '#B65C3F' }
      : c === 'amber'
      ? { text: 'text-[#B4915B]', border: 'border-[#B4915B]', dot: 'bg-[#B4915B]', stroke: '#B4915B' }
      : { text: 'text-[#7C9082]', border: 'border-[#7C9082]', dot: 'bg-[#7C9082]', stroke: '#7C9082' };

  const bandColour = (key: string) =>
    key === 'ad-hoc' || key === 'reactive' ? 'red' : key === 'building' ? 'amber' : 'green';

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <div className="flex items-center gap-3">
          <img src="/logo-white.png" alt="PerforMetrix" className="h-7" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">
          Performance review maturity in the AI era
        </div>
        <h1 className="text-[34px] font-display font-medium leading-1.15">{displayName}</h1>
        <p className="text-[#E8E4DA] opacity-55 text-xs mt-1 mb-6">
          Organisation: {displayOrg}
        </p>

        {/* Legend */}
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-4 mb-6">
          <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-3">
            How to read this report
          </div>
          <ul className="text-sm text-[#E8E4DA] opacity-85 leading-relaxed list-disc pl-5 mb-3">
            <li>
              Your overall maturity score is the average of the five dimension scores below,
              each scored out of 100.
            </li>
            <li>
              Scores map to five bands. Colour follows the band: red for Ad hoc and Reactive,
              amber for Building, green for Embedded and Leading.
            </li>
            <li>
              Each dimension is scored from three answers. Below 60 means the behaviour is rare
              or absent. 60 to 74 means it is present but inconsistent. 75 and above means it is
              established.
            </li>
            <li>
              This is one person's view of your organisation, not a consensus. It is a starting
              point for discussion, not a final verdict.
            </li>
          </ul>
        </div>

        {/* Scoring key */}
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-4 mb-8">
          <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-3">
            Scoring key
          </div>
          <div className="space-y-2">
            {MATURITY_BANDS.map((b) => {
              const c = colour(bandColour(b.key));
              return (
                <div key={b.key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <div className="text-xs font-mono text-[#E8E4DA] opacity-80 w-16">{b.rangeLabel}</div>
                  <div className="text-xs font-display">{b.name}</div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#E8E4DA] opacity-50 mt-3">
            Every dimension contributes equally to the overall score, so a change in any one
            dimension moves the total by the same amount.
          </p>
        </div>

        {/* Overall score */}
        <div className="flex items-baseline gap-4 mb-8 pb-6 border-b border-[#333B4C]">
          <span className="text-[76px] font-display font-medium text-[#D8BE8F]">{overall}</span>
          <div>
            <div className="text-xs text-[#9AA3B5] uppercase tracking-wider">
              Overall maturity score
            </div>
            <span className={`text-xs uppercase tracking-wider ${colour(bandColour(band.key)).text}`}>
              {band.name} ({band.rangeLabel})
            </span>
            <p className="text-xs text-[#E8E4DA] opacity-60 mt-1">{band.description}</p>
          </div>
        </div>

        {/* Gauge grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {dimensions.map((dim: any) => {
            const dband = bandForScore(dim.score);
            const c = colour(colorForScore(dim.score));
            const strokeDashoffset = 201 * (1 - dim.score / 100);
            return (
              <div
                key={dim.key}
                className={`bg-[#1B2029] border rounded p-3 text-center ${c.border}`}
              >
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg width="80" height="80" viewBox="0 0 80 80" transform="rotate(-90)">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#333B4C" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke={c.stroke}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="201"
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-mono">{dim.score}</span>
                  </div>
                </div>
                <div className="text-sm font-display mb-1">{dim.name}</div>
                <div className={`text-[9px] uppercase tracking-wider ${c.text}`}>{dband.name}</div>
              </div>
            );
          })}
        </div>

        {/* Impact summary — all dimensions, tiered text */}
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-4 mb-8">
          <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-3">
            What this could mean for {displayOrg}
          </div>
          {dimensions.map((d: any) => {
            const dband = bandForScore(d.score);
            const c = colour(colorForScore(d.score));
            const text = DIMENSION_IMPACT[d.key]?.[impactTierForScore(d.score)] || '';
            return (
              <div key={d.key} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-display">{d.name}</div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${c.border} ${c.text}`}>
                    {dband.name} ({d.score})
                  </span>
                </div>
                <div className="text-sm text-[#E8E4DA] opacity-85 leading-relaxed">{text}</div>
              </div>
            );
          })}
        </div>

        {/* Where the next gain is */}
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-4 mb-8">
          <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-2">
            Where the next gain is
          </div>
          <p className="text-sm text-[#E8E4DA] opacity-85 leading-relaxed">
            {lowest.name} is the widest gap at {lowest.score} ({lowestBand.name}), {gap} points
            below {highest.name} at {highest.score} ({highestBand.name}). Because each dimension
            carries equal weight, lifting {lowest.name} by {gap} points would add {gain} points to
            the overall score. The same lift in any other dimension would add the same amount.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-[#1B2029] border border-[#B4915B] rounded p-4 mb-8">
          <div className="text-lg font-display mb-2">{call.title}</div>
          <p className="text-sm text-[#E8E4DA] opacity-90 leading-relaxed mb-4">{call.body}</p>
          <a
            href="https://cal.com/growthcircles/multiplesessions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-wider px-4 py-2 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85"
          >
            Book a meeting
          </a>
        </div>

        {/* Method note */}
        <div className="text-xs text-[#E8E4DA] opacity-50 leading-relaxed mt-6 pt-4 border-t border-[#333B4C]">
          Scores are calculated from 15 behaviour-based questions answered about your
          organisation. Each dimension is scored 0-100 based on how common the behaviour is.
          The overall score is the average of the five dimensions and tracks progress over time.
        </div>
      </main>
    </div>
  );
}
