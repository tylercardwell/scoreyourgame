'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FlagPennant } from '@phosphor-icons/react';
import { api, Busy, ErrorMessage } from './ui';
import { Shell } from './shell';
import { RoundList } from './round-list';
import type { RoundSummary } from '@/lib/types';
export function History() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [filter, setFilter] = useState('all');
  useEffect(() => {
    let mounted = true;
    api<RoundSummary[]>('/api/rounds')
      .then((data) => {
        if (mounted) setRounds(data);
      })
      .catch((e) => {
        if (mounted) setError(e.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const finished = rounds.filter((r) => r.status === 'completed');
  return (
    <Shell active="rounds">
      <main className="container history-page">
        <div className="section-title">
          <div>
            <p className="eyebrow">ON AND OFF THE COURSE</p>
            <h1>Your rounds.</h1>
            <p>Every game has a story. Here are yours.</p>
          </div>
          <Link href="/" className="button primary">
            Play a round <ArrowRight size={18} />
          </Link>
        </div>
        <div className="history-stats">
          <div>
            <strong>{rounds.length}</strong>
            <span>Rounds played</span>
          </div>
          <div>
            <strong>{finished.length}</strong>
            <span>Rounds completed</span>
          </div>
          <div>
            <strong>{rounds.filter((r) => r.status === 'active').length}</strong>
            <span>Ready to resume</span>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Filter rounds">
          {[
            ['all', 'All rounds'],
            ['active', 'In progress'],
            ['completed', 'Completed'],
          ].map(([value, label]) => (
            <button
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? 'selected' : ''}
              key={value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <ErrorMessage message={error} />
        {loading ? (
          <div className="loading-panel">
            <Busy text="Loading your rounds" />
          </div>
        ) : rounds.some((r) => filter === 'all' || r.status === filter) ? (
          <RoundList rounds={rounds.filter((r) => filter === 'all' || r.status === filter)} />
        ) : (
          <div className="history-empty">
            <FlagPennant size={40} weight="duotone" />
            <h2>{filter === 'all' ? 'Your first round is waiting.' : 'No rounds here yet.'}</h2>
            <p>Start a game or join a group to put a score on the board.</p>
            <Link href="/" className="button primary">
              Let’s play <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </main>
    </Shell>
  );
}
