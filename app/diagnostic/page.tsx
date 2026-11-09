'use client';

import { useState } from 'react';
import { DIMENSION_ORDER, DIMENSIONS } from '@/lib/diagnostic/data';

function getDimensionName(key: string) {
  const names: Record<string, string> = {
    vision: 'Vision and strategy',
    criteria: 'Criteria and goals',
    manager: 'Manager capability',
    accountability: 'Accountability and guardrails',
    culture: 'Culture and trust',
  };
  return names[key] || key;
}

export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questions = DIMENSION_ORDER.flatMap((key) =>
    DIMENSIONS.find((d) => d.key === key)!.questions.map((q) => ({ ...q, dimension: key })),
  );

  const totalQuestions = questions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(answers).length < totalQuestions) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.userName || '',
          organisation: answers.userOrg || '',
          email: answers.userEmail || '',
          password: answers.userPassword || '',
          answers: Object.fromEntries(
            Object.entries(answers).filter(([k]) => !k.startsWith('user')),
          ),
        }),
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
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PerforMetrix" className="h-8" />
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-xs text-[#9AA3B5] uppercase tracking-wider">
            Sign in
          </a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-6 mb-6">
          <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-2">
            AI Maturity Diagnostic
          </div>
          <h1 className="text-[34px] font-display font-medium leading-1.15">Welcome</h1>
          <p className="text-[#E8E4DA] opacity-75 leading-relaxed mt-3">
            Answer all 15 questions. Think about what you actually see happening in your
            organisation, not what you wish were true.
          </p>

          {error && <p className="text-[#B65C3F] text-sm mt-3">{error}</p>}

          <form onSubmit={handleSubmit}>
            {DIMENSION_ORDER.map((key) => {
              const dim = DIMENSIONS.find((d) => d.key === key)!;
              return (
                <div key={key} className="bg-[#1B2029] border border-[#333B4C] rounded p-4 mt-5">
                  <div className="text-xl font-display mb-2">{getDimensionName(key)}</div>
                  {dim.questions.map((q) => (
                    <div key={q.key} className="mb-3">
                      <label className="text-sm text-[#E8E4DA] opacity-90 block mb-2">
                        {q.text}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 cursor-pointer opacity-80"
                          >
                            <input
                              type="radio"
                              name={q.key}
                              value={i}
                              checked={answers[q.key] === i}
                              onChange={(e) =>
                                setAnswers({ ...answers, [q.key]: parseInt(e.target.value, 10) })
                              }
                              className="accent-[#B4915B]"
                            />
                            <span>{i === 1 ? 'Never' : i === 5 ? 'Always' : i}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="flex justify-between items-center mt-6">
              <span className="text-xs text-[#9AA3B5] uppercase tracking-wider">
                {Object.keys(answers).filter((k) => !k.startsWith('user')).length}/{totalQuestions}
                answered
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs uppercase tracking-wider px-4 py-2 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] opacity-75 hover:opacity-85 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Get my report'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
