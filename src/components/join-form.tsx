'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, CheckCircle } from '@phosphor-icons/react';
import { authClient } from '@/lib/auth-client';
import { api, Busy, ErrorMessage } from './ui';
import { AuthModal } from './auth-modal';
export function JoinForm({ initialCode = '' }: { initialCode?: string }) {
  const { data: session } = authClient.useSession();
  const [code, setCode] = useState(initialCode),
    [nickname, setNickname] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  async function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api<{ id: string }>('/api/rounds/join', 'POST', {
        code: code.replace(/\s/g, ''),
        nickname: (nickname ?? session?.user.name ?? '').trim(),
      });
      router.push(`/round/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join the round.');
      setBusy(false);
    }
  }
  return (
    <>
      <form className="form-stack" onSubmit={join}>
        <label>
          Invitation code
          <input
            className="code-input"
            name="code"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            required
            minLength={8}
            maxLength={8}
            pattern="[0-9]{8}"
            placeholder="0000 0000"
          />
        </label>
        <label>
          {session ? 'Name on the scorecard' : 'Your nickname'}
          <input
            key={session?.user.id ?? 'guest'}
            name="nickname"
            value={nickname ?? session?.user.name ?? ''}
            onChange={(e) => setNickname(e.target.value)}
            required
            minLength={2}
            maxLength={30}
            autoComplete="nickname"
            placeholder="What should your friends call you?"
          />
        </label>
        <div className="guest-notice">
          {session ? <CheckCircle size={18} /> : <User size={18} />}
          <span>
            {session
              ? `Joining as ${session.user.name}`
              : 'No account needed. Just a name and you’re in.'}
          </span>
        </div>
        <ErrorMessage message={error} />
        <button className="button primary full" disabled={busy}>
          {busy ? (
            <Busy text="Joining the round" />
          ) : (
            <>
              Join round <ArrowRight size={19} />
            </>
          )}
        </button>
      </form>
      {!session && (
        <p className="switch-auth">
          Have an account?{' '}
          <button className="text-button" onClick={() => setAuthOpen(true)}>
            Sign in instead
          </button>
        </p>
      )}
      {authOpen && <AuthModal close={() => setAuthOpen(false)} done={() => setAuthOpen(false)} />}
    </>
  );
}
