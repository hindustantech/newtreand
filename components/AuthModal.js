'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, LockKeyhole, User as UserIcon } from 'lucide-react';

export default function AuthModal({ open, onClose, login, register }) {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setError(null);
    setBusy(false);
    setPassword('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      reset();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-base/70"
          />
          <motion.div
            key="auth-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="glass-strong fixed left-1/2 top-1/2 z-50 w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[32px] p-7"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-soft transition hover:bg-white/10"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/25">
                <UserIcon size={20} className="text-accent" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-xs text-muted">
                  {mode === 'login' ? 'Sign in to manage playlists' : 'Save and share your playlists'}
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-2xl bg-white/5 p-1 text-xs font-semibold">
              {['login', 'register'].map((option) => (
                <button key={option} type="button" onClick={() => { setMode(option); setError(null); }} className={`rounded-xl px-3 py-2 transition ${mode === option ? 'bg-white text-base shadow-sm' : 'text-soft hover:text-white'}`}>
                  {option === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { router.push('/api/auth/google'); }}
              className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>

            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider text-muted">or continue with email</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-soft">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/60 focus:bg-white/10"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-soft"><LockKeyhole size={12} /> Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/60 focus:bg-white/10"
                  placeholder="••••••••"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-base transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form> */}

            <p className="mt-5 text-center text-xs text-muted">Your playlists and uploaded artwork stay private to your account for editing.</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
