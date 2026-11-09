'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Login failed.');
        setSubmitting(false);
        return;
      }
      window.location.href = data.redirect || '/admin';
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14171F] text-[#E8E4DA] flex flex-col items-center justify-center p-6">
      <div className="bg-[#1B2029] border border-[#333B4C] rounded p-8 max-w-md w-full">
        <img src="/logo.png" alt="PerforMetrix" className="h-7 mb-6" />
        <h1 className="text-3xl font-display font-medium mb-1">Admin sign in</h1>
        <p className="text-xs opacity-50 mb-6">For reviewing diagnostic submissions.</p>

        {error && <p className="text-[#B65C3F] text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
            />
          </div>
          <div className="mb-6">
            <label className="text-[11px] text-[#9AA3B5] uppercase tracking-wider block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-[#242A38] border border-[#333B4C] rounded px-3 py-2 outline-none focus:border-[#B4915B]"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs uppercase tracking-wider px-4 py-2.5 rounded border border-[#B4915B] bg-[#B4915B] text-[#14171F] hover:opacity-85 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs opacity-50 mt-6 text-center">
          Taking the diagnostic?{' '}
          <a href="/diagnostic" className="text-[#D8BE8F] hover:underline">
            Start here
          </a>
        </p>
      </div>
    </div>
  );
}
