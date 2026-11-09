'use client';

import { useEffect, useState } from 'react';

type Report = {
  submissionId: string;
  name: string;
  organisation: string;
  submittedAt: string;
  overall: number | null;
  band: string | null;
  flagged: number;
};

export default function AdminPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin')
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error || 'Please sign in as admin.');
          return;
        }
        setReports(data.reports || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] flex flex-col items-center justify-center p-6">
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-8 max-w-md">
          <div className="text-xl font-display mb-2">Admin access required</div>
          <p className="text-[#E8E4DA] opacity-75 mb-4">{error}</p>
          <a href="/login" className="text-[#D8BE8F] hover:underline">
            Sign in as admin
          </a>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] flex items-center justify-center p-6">
        <p className="text-sm uppercase tracking-wider opacity-60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <img src="/logo.png" alt="PerforMetrix" className="h-8" />
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="text-xs text-[#D8BE8F] uppercase tracking-wider">
            Sign out
          </button>
        </form>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">Admin</div>
        <h1 className="text-[34px] font-display font-medium mb-1">Diagnostic submissions</h1>
        <p className="text-sm opacity-60 mb-6">
          {reports.length} {reports.length === 1 ? 'submission' : 'submissions'}
        </p>

        {reports.length === 0 ? (
          <div className="bg-[#1B2029] border border-[#333B4C] rounded p-6 text-sm opacity-60">
            No submissions yet.
          </div>
        ) : (
          <div className="bg-[#1B2029] border border-[#333B4C] rounded divide-y divide-[#333B4C]">
            {reports.map((r) => (
              <div key={r.submissionId} className="flex items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-display text-lg">{r.name}</div>
                  <div className="text-xs opacity-60">{r.organisation}</div>
                  <div className="text-xs opacity-40 mt-1">
                    {new Date(r.submittedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {r.overall !== null && (
                    <div className="text-right">
                      <div className="font-display text-2xl text-[#D8BE8F]">{r.overall}</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-60">
                        {r.band}
                      </div>
                    </div>
                  )}
                  {r.flagged > 0 && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-[#B65C3F] text-[#B65C3F]">
                      {r.flagged} gap{r.flagged === 1 ? '' : 's'}
                    </span>
                  )}
                  <a
                    href={`/diagnostic/report/${r.submissionId}`}
                    className="text-xs uppercase tracking-wider px-3 py-1.5 rounded border border-[#B4915B] text-[#D8BE8F] hover:bg-[#B4915B] hover:text-[#14171F]"
                  >
                    View report
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
