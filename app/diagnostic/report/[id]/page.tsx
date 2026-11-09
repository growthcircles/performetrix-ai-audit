import { createServiceClient } from '@/lib/diagnostic/supabase';

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
            generated from the 15-question AI maturity diagnostic.
          </p>
          <a href="/diagnostic" className="inline-block mt-4 text-[#D8BE8F] hover:underline">
            Take the diagnostic
          </a>
        </div>
      </div>
    );
  }

  const overall = scores.overall ?? 0;
  const band = scores.band || {
    key: 'ad-hoc',
    name: 'Ad hoc',
    rangeLabel: '0-39',
    description: 'No clear position yet.',
  };

  const raw = (submission.raw_answers || {}) as any;
  const respondent = raw.__respondent || {};
  const displayName = respondent.name || submission.leaders.name;
  const displayOrg =
    respondent.organisation || submission.leaders.customers?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PerforMetrix" className="h-8" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">
          AI Maturity Diagnostic Report
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
              Your overall AI maturity score is the average of the five dimension scores below,
              each scored out of 100.
            </li>
            <li>
              Scores at or below 80 are flagged as priority gaps — the areas where your
              organisation is most exposed.
            </li>
            <li>This is a diagnostic for where to focus, not a final verdict.</li>
          </ul>
          <div className="flex gap-4 pt-3 border-t border-[#333B4C]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#B4915B]" />
              <span className="text-xs text-[#E8E4DA] opacity-80">Score above 80, on track</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#B65C3F]" />
              <span className="text-xs text-[#E8E4DA] opacity-80">Score at or below 80, priority gap</span>
            </div>
          </div>
        </div>

        {/* Overall score */}
        <div className="flex items-baseline gap-4 mb-8 pb-6 border-b border-[#333B4C]">
          <span className="text-[76px] font-display font-medium text-[#D8BE8F]">{overall}</span>
          <div>
            <div className="text-xs text-[#9AA3B5] uppercase tracking-wider">
              Overall AI maturity score
            </div>
            <span className={`text-xs uppercase tracking-wider ${band.key === 'leading' || band.key === 'embedded' ? 'text-[#7C9082]' : band.key === 'building' ? 'text-[#B4915B]' : 'text-[#B65C3F]'}`}>
              {band.name}
            </span>
            <p className="text-xs text-[#E8E4DA] opacity-60 mt-1">{band.description}</p>
          </div>
        </div>

        {/* Gauge grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {dimensions.map((dim: any) => {
            const isFlagged = dim.score <= 80;
            const strokeColor = isFlagged ? '#B65C3F' : '#7C9082';
            const strokeDashoffset = 201 * (1 - dim.score / 100);
            const bandLabel = dim.score > 80 ? 'On track' : 'Priority gap';
            const labelColor = dim.score > 80 ? '#7C9082' : '#B65C3F';
            return (
              <div
                key={dim.key}
                className={`bg-[#1B2029] border border-[#333B4C] rounded p-3 text-center ${isFlagged ? 'border-[#B65C3F]' : 'border-[#7C9082]'}`}
              >
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg width="80" height="80" viewBox="0 0 80 80" transform="rotate(-90)">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#333B4C" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke={strokeColor}
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
                <div className={`text-[9px] uppercase tracking-wider ${labelColor}`}>{bandLabel}</div>
              </div>
            );
          })}
        </div>

        {/* Impact summary */}
        <div className="bg-[#1B2029] border border-[#B65C3F] rounded p-4 mb-8">
          <div className="text-[11px] text-[#B65C3F] uppercase tracking-wider mb-2">
            What this could mean for {displayOrg}
          </div>
          {dimensions
            .filter((d: any) => d.score <= 80)
            .map((dim: any) => (
              <div key={dim.key} className="mb-3 last:mb-0">
                <div className="text-sm font-display mb-1">{dim.name}</div>
                <div className="text-sm text-[#E8E4DA] opacity-85 leading-relaxed">
                  {dim.band.description}
                </div>
              </div>
            ))}
        </div>

        {/* CTA */}
        <div className="bg-[#1B2029] border border-[#B4915B] rounded p-4 mb-8">
          <div className="text-lg font-display mb-2">
            Your results show gaps that warrant a closer conversation.
          </div>
          <p className="text-sm text-[#E8E4DA] opacity-90 leading-relaxed mb-4">
            Five dimensions were assessed. Some sit below the priority threshold, which means
            your organisation is exposed in areas that compound over time. We help organisations
            close these gaps. If you would like to discuss what these findings mean for your
            organisation, book a call.
          </p>
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

