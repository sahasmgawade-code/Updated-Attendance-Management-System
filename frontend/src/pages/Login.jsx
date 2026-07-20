import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className="font-display text-4xl font-600 text-forestDark">Attend</span>
            <span className="font-mono text-sm tracking-widest text-brick uppercase">QR</span>
          </div>
          <p className="text-sm text-ink/50 font-mono">sign the register</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-rule rounded-lg p-8 space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-rule rounded px-3 py-2 bg-paper focus-visible:outline-forest"
              placeholder="admin@attendqr.com"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-rule rounded px-3 py-2 bg-paper focus-visible:outline-forest"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-brick font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-paper rounded py-2.5 font-medium hover:bg-forestDark transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}