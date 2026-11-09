'use client';

import { useState } from 'react';
import { DIMENSION_ORDER, DIMENSIONS } from '@/lib/diagnostic/data';

const DIMENSION_NAMES: Record<string, string> = {
  vision: 'Vision and strategy',
  criteria: 'Criteria and goals',
  manager: 'Manager capability',
  accountability: 'Accountability and guardrails',
  culture: 'Culture and trust',
};

export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questions = DIMENSION_ORDER.flatMap((key) =>
    DIMENSIONS.find((d) => d.key === key)!.questions.map((q) => ({ ...q, dimension: key })),
  );
  const totalQuestions = questions.length;
  const answered = Object.keys(answers).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (answered < totalQuestions) {
      setError('Please answer all 15 questions before submitting.');
      return;
    }
    if (!name || !organisation || !email || !password) {
      setError('Please complete your details.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organisation, email, password, answers }),
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
        <img src="/logo.png" alt="PerforMetrix" className="h-8" />
        <a href="/login" className="text-xs text-[#9AA3B5] uppercase tracking-wider hover:text-[#D8BE8F]">
          Sign in
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">
          AI Maturity Diagnostic
        </div>
        <h1 className="text-3xl font-display font-medium mb-3">
          Fifteen questions. Ten minutes.
        </h1>
        <p className="text-sm opacity-70 leading-relaxed mb-8">
          Answer about what you actually see happening in your organisation, not what you wish
          were true. Your report is generated immediately.
        </p>

        {error && (
          <div className="border border-[#B65C3F] bg-[rgba(182,92,63,0.08)] rounded p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {DIMENSION_ORDER.map((key) => {
            const dim = DIMENSIONS.find((d) => d.key === key)!;
            return (
              <div key={key} className="border-t border-[#333B4C] pt-6 mt-6">
                <div className="font-display text-lg mb-4">{DIMENSION_NAMES[key]}</div>
                {dim.questions.map((q) => (
                  <div key={q.key} className="mb-5">
                    <div className="text-sm opacity-90 mb-2">{q.text}</div>
                    <div className="flex flex-wrap gap-4">
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
                            {i === 1 ? 'Never' : i === 5 ? 'Always' : i}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="border-t border-[#333B4C] pt-6 mt-6">
            <div className="font-display text-lg mb-4">Your details</div>
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
                />
              </div>
              <div>
                <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#333B4C]">
            <span className="text-xs uppercase tracking-wider opacity-60">
              {answered}/{totalQuestions} answered
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="text-xs uppercase tracking-wider px-5 py-2.5 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85 disabled:opacity-50"
            >
              {submitting ? 'Generating…' : 'Get my report'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
