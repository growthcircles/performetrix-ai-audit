'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('userId='))
      ?.split('=')[1];

    if (!userId) {
      window.location.href = '/login';
      return;
    }

    fetch(`/api/admin?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error || !data.ok) {
          setError(data.error || 'Failed to load admin data.');
          setLoading(false);
          return;
        }
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body flex flex-col items-center justify-center p-6">
        <div className="text-sm text-[#9AA3B5] uppercase tracking-wider">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body flex flex-col items-center justify-center p-6">
        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-8">
          <div className="text-xl font-display mb-2">Admin access required</div>
          <p className="text-[#E8E4DA] opacity-75">{error}</p>
          <a href="/login" className="text-[#D8BE8F] mt-4 inline-block hover:underline">
            Sign in as admin
          </a>
        </div>
      </div>
    );
  }

  const isAdmin = data.user.role === 'admin';
  const reportList = data.submission
    ? [
        {
          user: data.user,
          submission: data.submission,
          hasCompleted: true,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#333B4C] bg-[#1B2029]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PerforMetrix" className="h-6" />
        </div>
        <div className="flex items-center gap-4">
          <a href="/diagnostic" className="text-xs text-[#9AA3B5] uppercase tracking-wider">
            Diagnostic
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); document.cookie = 'userId=; path=/; max-age=0'; window.location.href = '/login'; }} className="text-xs text-[#D8BE8F] uppercase tracking-wider">
            Sign out
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">Admin</div>
            <h1 className="text-[34px] font-display font-medium">{data.user.name}</h1>
          </div>
          {!isAdmin && (
            <a href="/diagnostic" className="text-xs uppercase tracking-wider px-3 py-1 rounded border border-[#333B4C] hover:border-[#B4915B]">
              Take diagnostic
            </a>
          )}
        </div>

        <div className="bg-[#1B2029] border border-[#333B4C] rounded p-6 mb-6">
          <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-2">
            Organisations ({reportList.length})
          </div>
          <div className="space-y-2">
            {reportList.map((item: any) => (
              <div
                key={item.user.id}
                className="flex items-center justify-between border-b border-[#333B4C] pb-2 last:border-0"
              >
                <div>
                  <div className="font-display">{item.user.name}</div>
                  <div className="text-[10px] text-[#9AA3B5]">{item.user.email}</div>
                  <div className="text-[10px] text-[#9AA3B5]">
                    {item.user.organisation || 'No organisation'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.hasCompleted ? (
                    <>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#1B2029] border border-[#7C9082] text-[#7C9082]">
                        Completed survey
                      </span>
                      <a
                        href={`/diagnostic/report/${item.submission.id}`}
                        className="text-[10px] text-[#D8BE8F] hover:underline"
                      >
                        View report
                      </a>
                    </>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[#1B2029] border border-[#B4915B] text-[#B4915B]">
                      Not started
                    </span>
                  )}
                </div>
              </div>
            ))}
            {reportList.length === 0 && (
              <div className="text-sm text-[#E8E4DA] opacity-50 py-2">
                No organisations yet.
              </div>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-[#1B2029] border border-[#333B4C] rounded p-6">
            <div className="text-[11px] text-[#9AA3B5] uppercase tracking-wider mb-2">
              Admin access required
            </div>
            <p className="text-sm text-[#E8E4DA] opacity-75">
              You do not have admin access to this account. Contact your administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
