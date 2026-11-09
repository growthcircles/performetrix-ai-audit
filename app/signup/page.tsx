'use client';

import { useState } from 'react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organisation, email, password, confirm, answers: {} }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Signup failed.');
        setSubmitting(false);
        return;
      }

      document.cookie = `userId=${data.userId}; path=/; max-age=2592000`;
      window.location.href = `/diagnostic/report/${data.submissionId}`;
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] font-body flex flex-col items-center justify-center p-6">
      <div className="bg-[#1B2029] border border-[#333B4C] rounded p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.png" alt="PerforMetrix" className="h-6" />
        </div>
        <h1 className="text-[34px] font-display font-medium mb-6">Create account</h1>

        {error && <p className="text-[#B65C3F] text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Full name
            </label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 text-[#E8E4DA] focus:border-[#B4915B] outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Organisation name
            </label>
            <input
              type="text"
              name="organisation"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              required
              autoComplete="organization"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 text-[#E8E4DA] focus:border-[#B4915B] outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Work email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 text-[#E8E4DA] focus:border-[#B4915B] outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 text-[#E8E4DA] focus:border-[#B4915B] outline-none"
            />
          </div>
          <div className="mb-6">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Confirm password
            </label>
            <input
              type="password"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 text-[#E8E4DA] focus:border-[#B4915B] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs uppercase tracking-wider px-4 py-2 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] opacity-75 hover:opacity-85 disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-[#E8E4DA] opacity-75 mt-4 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-[#D8BE8F] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
