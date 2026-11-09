'use client';

import { useMemo, useState } from 'react';
import { DIMENSION_ORDER, DIMENSIONS } from '@/lib/diagnostic/data';

type Question = { key: string; text: string };

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CAL_URL = 'https://cal.com/growthcircles/multiplesessions';

export default function DiagnosticPage() {
  const questions = useMemo<Question[]>(() => {
    const all = DIMENSION_ORDER.flatMap((key) =>
      DIMENSIONS.find((d) => d.key === key)!.questions.map((q) => ({ key: q.key, text: q.text })),
    );
    return shuffled(all);
  }, []);

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answered = Object.keys(answers).length;
  const total = questions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (answered < total) {
      setError(`Please answer all ${total} questions before submitting.`);
      return;
    }
    if (!name.trim() || !organisation.trim() || !email.trim()) {
      setError('Please complete your details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organisation, email, answers }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      window.location.href = `/diagnostic/report/${data.submissionId}`;
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <img src="/logo-white.png" alt="PerforMetrix" className="h-7" />
        <a href="/login" className="text-xs text-[#9AA3B5] uppercase tracking-wider hover:text-[#D8BE8F]">
          Admin
        </a>
      </nav>

      {!started ? (
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-3">
            PerforMetrix - Measuring what really matters
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium leading-tight mb-5">
            How will your organisation manage performance in the AI era?
          </h1>
          <p className="text-base opacity-80 leading-relaxed mb-4">
            Drawing on the work we are doing with organisations like yours, this diagnostic focuses
            on the challenges that make it hard to assess employee performance objectively, and to
            support people appropriately, once AI is part of the work.
          </p>
          <p className="text-sm opacity-60 leading-relaxed mb-8">
            This is not an AI readiness assessment or a technology audit. It is about how
            performance is managed when AI is part of the work.
          </p>

          <div className="border border-[#333B4C] rounded p-5 mb-6">
            <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-3">
              What you get
            </div>
            <ul className="text-sm opacity-85 leading-relaxed space-y-2">
              <li>A maturity score out of 100, and where you sit on a five-band scale</li>
              <li>Five dimension scores showing where your approach is strong and where it is exposed</li>
              <li>The priority gaps, and what each one could mean for how you manage performance</li>
            </ul>
          </div>

          <ul className="text-sm opacity-70 leading-relaxed space-y-1.5 mb-8">
            <li>15 questions, about 10 minutes</li>
            <li>No preparation needed</li>
            <li>Report generated immediately and emailed to you</li>
          </ul>

          <p className="text-xs opacity-50 leading-relaxed mb-8">
            Your answers are used only to produce your report. Nothing is shared with anyone else
            in your organisation.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="text-xs uppercase tracking-wider px-6 py-3 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85"
            >
              Start the diagnostic
            </button>
            <a
              href={CAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9AA3B5] hover:text-[#D8BE8F]"
            >
              Prefer to talk first? Book a call
            </a>
          </div>

          <div className="text-xs opacity-35 mt-12 pt-6 border-t border-[#333B4C]">
            PerforMetrix - Measuring what really matters
          </div>
        </main>
      ) : (
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">
            Performance review diagnostic
          </div>
          <h1 className="text-2xl font-display font-medium mb-2">Fifteen questions</h1>
          <p className="text-sm opacity-70 leading-relaxed mb-2">
            Below are real-life scenarios playing out in workplaces every day. Tell us how common
            each one is in your organisation.
          </p>
          <p className="text-xs opacity-45 mb-8">
            There is no right answer, and the questions appear in a different order each time.
          </p>

          {error && (
            <div className="border border-[#B65C3F] bg-[rgba(182,92,63,0.08)] rounded p-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {questions.map((q, idx) => (
              <div key={q.key} className="border-t border-[#333B4C] py-5">
                <div className="flex gap-3 mb-3">
                  <span className="font-mono text-xs opacity-40 pt-0.5">{idx + 1}</span>
                  <div className="text-sm opacity-90">{q.text}</div>
                </div>
                <div className="flex flex-wrap gap-4 pl-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <label key={i} className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name={q.key}
                        value={i}
                        checked={answers[q.key] === i}
                        onChange={() => setAnswers((a) => ({ ...a, [q.key]: i }))}
                        className="accent-[#B4915B]"
                      />
                      <span className="opacity-80">
                        {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][i - 1]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-[#333B4C] pt-6 mt-6">
              <div className="font-display text-lg mb-1">Where should we send your report?</div>
              <p className="text-xs opacity-50 mb-4">
                We send a copy of the report and can follow up if you would like to talk it through.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                    Full name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                    Organisation
                  </label>
                  <input
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    required
                    className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                    Work email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#333B4C]">
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="text-xs uppercase tracking-wider opacity-50 hover:opacity-80"
              >
                Back
              </button>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-wider opacity-60">
                  {answered}/{total} answered
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-xs uppercase tracking-wider px-5 py-2.5 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85 disabled:opacity-50"
                >
                  {submitting ? 'Generating…' : 'Get my report'}
                </button>
              </div>
            </div>
          </form>
        </main>
      )}
    </div>
  );
}






