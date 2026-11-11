'use client';

import { useEffect, useState, useCallback } from 'react';

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

type AdminUser = {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
};

type Tab = 'submissions' | 'users';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('submissions');
  const [reports, setReports] = useState<Report[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Add user form state
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit user form state
  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Please sign in as admin.');
        return;
      }
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Please sign in as admin.');
        return;
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchUsers();
  }, [fetchReports, fetchUsers]);

  const confirmed = (reports || []).filter((r) => r.emailConfirmed).length;

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm('Delete this submission? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Delete failed.');
        return;
      }
      setReports((prev) => (prev ? prev.filter((r) => r.submissionId !== id) : prev));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, name: addName, password: addPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add admin.');
        return;
      }
      setAddEmail('');
      setAddName('');
      setAddPassword('');
      setAddError(null);
      setUsers((prev) => (prev ? [...prev, data.user] : [data.user]));
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setLoading(true);
    try {
      const body: any = {};
      if (editEmail) body.email = editEmail;
      if (editName) body.name = editName;
      if (editPassword) body.password = editPassword;
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Update failed.');
        return;
      }
      setEditId(null);
      setEditEmail('');
      setEditName('');
      setEditPassword('');
      setEditError(null);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this admin user? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Delete failed.');
        return;
      }
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== id) : prev));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active: !user.is_active }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Update failed.');
        return;
      }
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u)) : prev,
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading && !reports && !users) {
    return (
      <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] flex items-center justify-center p-6">
        <p className="text-sm uppercase tracking-wider opacity-60">Loading…</p>
      </div>
    );
  }

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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-2">Admin</div>
        <h1 className="text-[34px] font-display font-medium mb-1">Admin</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#333B4C]">
          <button
            onClick={() => setTab('submissions')}
            className={`-mb-px border-b-2 px-3 py-2 text-xs uppercase tracking-wider ${
              tab === 'submissions'
                ? 'border-[#B4915B] text-[#D8BE8F]'
                : 'border-transparent text-[#9AA3B5] opacity-70 hover:text-[#D8BE8F]'
            }`}
          >
            Submissions
          </button>
          <button
            onClick={() => setTab('users')}
            className={`-mb-px border-b-2 px-3 py-2 text-xs uppercase tracking-wider ${
              tab === 'users'
                ? 'border-[#B4915B] text-[#D8BE8F]'
                : 'border-transparent text-[#9AA3B5] opacity-70 hover:text-[#D8BE8F]'
            }`}
          >
            Admin users
          </button>
        </div>

        {tab === 'submissions' && (
          <>
            <p className="text-sm opacity-60 mb-6">
              {reports?.length ?? 0} {reports?.length === 1 ? 'submission' : 'submissions'} ·{' '}
              {confirmed} confirmed {confirmed === 1 ? 'email' : 'emails'}
            </p>

            {(reports?.length ?? 0) === 0 ? (
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
                        <div className="flex items-center gap-2">
                          <a
                            href={`/diagnostic/report/${r.submissionId}`}
                            className="text-xs uppercase tracking-wider px-3 py-1.5 rounded border border-[#B4915B] text-[#D8BE8F] hover:bg-[#B4915B] hover:text-[#14171F]"
                          >
                            View report
                          </a>
                          <button
                            onClick={() => handleDeleteSubmission(r.submissionId)}
                            className="text-xs uppercase tracking-wider px-3 py-1.5 rounded border border-[#B65C3F] text-[#B65C3F] hover:bg-[#B65C3F] hover:text-[#14171F]"
                          >
                            Delete
                          </button>
                        </div>
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
          </>
        )}

        {tab === 'users' && (
          <>
            <div className="mb-6 bg-[#1B2029] border border-[#333B4C] rounded p-5">
              <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-3">Add admin user</div>
              <form onSubmit={handleAddUser}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      required
                      className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                      Name
                    </label>
                    <input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
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
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      required
                      className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="text-xs uppercase tracking-wider px-4 py-2.5 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {addError && <p className="text-xs text-[#B65C3F] mt-2">{addError}</p>}
              </form>
            </div>

            {(users?.length ?? 0) === 0 ? (
              <div className="bg-[#1B2029] border border-[#333B4C] rounded p-6 text-sm opacity-60">
                No admin users yet.
              </div>
            ) : (
              <div className="bg-[#1B2029] border border-[#333B4C] rounded divide-y divide-[#333B4C]">
                {users.map((u) => (
                  <div key={u.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-display text-lg">{u.name}</div>
                        <div className="text-xs opacity-60">{u.email}</div>
                        <div className="text-xs opacity-40 mt-1">
                          {new Date(u.created_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded border ${
                            u.is_active
                              ? 'border-[#7C9082] text-[#7C9082] hover:bg-[#7C9082] hover:text-[#14171F]'
                              : 'border-[#B65C3F] text-[#B65C3F] hover:bg-[#B65C3F] hover:text-[#14171F]'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 rounded border border-[#B65C3F] text-[#B65C3F] hover:bg-[#B65C3F] hover:text-[#14171F]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#333B4C]">
                      <div className="text-xs text-[#9AA3B5] uppercase tracking-wider mb-3">Edit</div>
                      <form onSubmit={handleUpdateUser}>
                        <input
                          type="hidden"
                          value={editId === u.id ? '' : u.id}
                          onChange={(e) => setEditId(e.target.value || null)}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                              Email
                            </label>
                            <input
                              value={editId === u.id ? editEmail : ''}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder={u.email}
                              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                              Name
                            </label>
                            <input
                              value={editId === u.id ? editName : ''}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder={u.name}
                              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
                              Password
                            </label>
                            <input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Leave blank to keep current"
                              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={loading}
                              className={`text-xs uppercase tracking-wider px-4 py-2.5 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85 disabled:opacity-50 ${
                                editId !== u.id ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                        {editError && editId === u.id && (
                          <p className="text-xs text-[#B65C3F] mt-2">{editError}</p>
                        )}
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
