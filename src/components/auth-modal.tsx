'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Modal, Busy, ErrorMessage } from './ui';
export function AuthModal({
  close,
  done,
  initial = 'signin',
}: {
  close: () => void;
  done: () => void;
  initial?: 'signin' | 'signup';
}) {
  const [mode, setMode] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    try {
      const identity = String(data.get('identity') ?? '').trim(),
        password = String(data.get('password'));
      const result =
        mode === 'signup'
          ? await authClient.signUp.email({
              email: String(data.get('email')).trim(),
              password,
              name: String(data.get('name')).trim(),
              username: String(data.get('username')).trim(),
            })
          : identity.includes('@')
            ? await authClient.signIn.email({ email: identity, password })
            : await authClient.signIn.username({ username: identity, password });
      if (result.error)
        throw new Error(result.error.message ?? 'Unable to sign in. Please try again.');
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={mode === 'signup' ? 'Make it your game.' : 'Welcome back.'} close={close}>
      <p className="modal-intro">
        {mode === 'signup'
          ? 'Create an account to host rounds and keep your golf history.'
          : 'Sign in to host a round or pick up where you left off.'}
      </p>
      <form onSubmit={submit} className="form-stack">
        {mode === 'signup' ? (
          <>
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={30}
                placeholder="How should we call you?"
              />
            </label>
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_.]+"
                placeholder="Your unique username"
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>
          </>
        ) : (
          <label>
            Email or username
            <input name="identity" autoComplete="username" required placeholder="you@example.com" />
          </label>
        )}
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={mode === 'signup' ? 8 : 1}
            maxLength={128}
            placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
          />
        </label>
        <ErrorMessage message={error} />
        <button className="button primary full" disabled={busy}>
          {busy ? <Busy /> : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="switch-auth">
        {mode === 'signup' ? 'Already have an account?' : 'New to ScoreYourGame?'}{' '}
        <button
          className="text-button"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup');
            setError('');
          }}
        >
          {mode === 'signup' ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </Modal>
  );
}
