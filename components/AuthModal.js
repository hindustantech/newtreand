'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, LockKeyhole, User as UserIcon } from 'lucide-react';

export default function AuthModal({ open, onClose, login, register }) {
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

            <form onSubmit={submit} className="space-y-4">
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
            </form>

            <p className="mt-5 text-center text-xs text-muted">Your playlists and uploaded artwork stay private to your account for editing.</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
