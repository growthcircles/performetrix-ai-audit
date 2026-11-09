'use client';

import { useEffect, useState } from 'react';

type Report = {
  submissionId: string;
  name: string;
  organisation: string;
  email: string;
  emailConfirmed: boolean;
  submittedAt: string;
  overall: number | null;
  band: string | null;
  flagged: string[];
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

  const confirmed = reports.filter((r) => r.emailConfirmed).length;

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <img src="/logo-white.png" alt="PerforMetrix" className="h-7" />
        <a
          href="/api/auth/logout"
          className="text-xs text-[#9AA3B5] uppercase tracking-wider hover:text-[#D8BE8F]"
        >
          Sign out
        </a>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">Admin</div>
        <h1 className="text-[34px] font-display font-medium mb-1">Diagnostic submissions</h1>
        <p className="text-sm opacity-60 mb-6">
          {reports.length} {reports.length === 1 ? 'submission' : 'submissions'} · {confirmed}{' '}
          confirmed {confirmed === 1 ? 'email' : 'emails'}
        </p>

        {reports.length === 0 ? (
          <div className="bg-[#1B2029] border border-[#333B4C] rounded p-6 text-sm opacity-60">
            No submissions yet.
          </div>
        ) : (
          <div className="bg-[#1B2029] border border-[#333B4C] rounded divide-y divide-[#333B4C]">
            {reports.map((r) => (
              <div key={r.submissionId} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-lg">
                      {r.name}
                      {r.emailConfirmed && (
                        <span className="ml-2 align-middle text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#7C9082] text-[#7C9082]">
                          Confirmed
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-60">{r.organisation}</div>
                    <a href={`mailto:${r.email}`} className="text-xs text-[#D8BE8F] hover:underline">
                      {r.email}
                    </a>
                    <div className="text-xs opacity-40 mt-1">
                      {new Date(r.submittedAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {r.overall !== null && (
                      <div className="text-right">
                        <div className="font-display text-2xl text-[#D8BE8F]">{r.overall}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60">
                          {r.band}
                        </div>
                      </div>
                    )}
                    <a
                      href={`/diagnostic/report/${r.submissionId}`}
                      className="text-xs uppercase tracking-wider px-3 py-1.5 rounded border border-[#B4915B] text-[#D8BE8F] hover:bg-[#B4915B] hover:text-[#14171F]"
                    >
                      View report
                    </a>
                  </div>
                </div>

                {r.flagged.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.flagged.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#B65C3F] text-[#B65C3F]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}



