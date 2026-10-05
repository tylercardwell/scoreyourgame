'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  FlagPennant,
  UsersThree,
  Check,
  CaretRight,
} from '@phosphor-icons/react';
import { authClient } from '@/lib/auth-client';
import type { Round, RoundSummary } from '@/lib/types';
import { Shell } from './shell';
import { api, Modal, ErrorMessage } from './ui';
import { AuthModal } from './auth-modal';
import { StartModal } from './start-modal';
import { JoinForm } from './join-form';
import { RoundList } from './round-list';
import { LeaderboardCard } from './leaderboard-card';
export function Home() {
  const { data: session } = authClient.useSession();
  const [modal, setModal] = useState<'auth' | 'start' | 'join' | null>(null),
    [rounds, setRounds] = useState<RoundSummary[]>([]),
    [liveRound, setLiveRound] = useState<Round | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    api<RoundSummary[]>('/api/rounds')
      .then((data) => {
        if (!mounted) return;
        setRounds(data);
        setError('');
        const featured = data.find((r) => r.status === 'active') ?? data[0];
        if (!featured) return setLiveRound(null);
        api<Round>(`/api/rounds/${featured.id}`)
          .then((round) => mounted && setLiveRound(round))
          .catch(() => undefined);
      })
      .catch(() => {
        if (mounted)
          setError('Round history is unavailable right now. Please refresh to try again.');
      });
    return () => {
      mounted = false;
    };
  }, [session?.user.id]);
  const start = () => setModal(session ? 'start' : 'auth');
  return (
    <Shell>
      <main className="tour-home">
        <div className="tour-hero">
          <div className="tour-hero-copy">
            <span className="live-tag">Live scoring</span>
            <h1>
              The leaderboard for <span>your group</span>
            </h1>
            <p className="tour-lede">
              Score every hole together. Everyone sees the standings update live — just like the
              tour, only with your friends.
            </p>
            {session && (
              <p className="tour-greeting">Good to see you, {session.user.name.split(' ')[0]}.</p>
            )}
            <div className="tour-cta">
              <button className="tour-btn tour-btn-solid" onClick={start}>
                Start a round
              </button>
              <button className="tour-btn tour-btn-outline" onClick={() => setModal('join')}>
                Join with a code
              </button>
            </div>
            <div className="hero-benefits">
              <span>
                <Check size={15} weight="bold" />
                Live scores
              </span>
              <span>
                <Check size={15} weight="bold" />
                No app to download
              </span>
              <span>
                <Check size={15} weight="bold" />
                Guests welcome
              </span>
            </div>
          </div>
          <LeaderboardCard round={liveRound} />
        </div>
        <section className="tour-actions" aria-label="Play golf">
          <div className="tour-action tour-action-start">
            <div>
              <h2>Start a round</h2>
              <p>Pick a course, pars load automatically.</p>
            </div>
            <button className="tour-btn tour-btn-white" onClick={start}>
              Let’s play <ArrowRight size={18} />
            </button>
          </div>
          <div className="tour-action tour-action-join">
            <div>
              <h2>Join your group</h2>
              <p>Got a code? No account needed.</p>
            </div>
            <button className="tour-btn tour-btn-white" onClick={() => setModal('join')}>
              Join a round <ArrowRight size={18} />
            </button>
          </div>
        </section>
        <div className="container tour-lower">
          <section className="recent-section">
            <div className="section-title">
              <div>
                <h2>Your rounds</h2>
                <p>Pick up where you left off.</p>
              </div>
              <Link href="/rounds" className="subtle-link">
                View all <ArrowUpRight size={17} />
              </Link>
            </div>
            <ErrorMessage message={error} />
            {rounds.length ? (
              <RoundList rounds={rounds.slice(0, 3)} />
            ) : (
              <div className="empty-rounds">
                <span className="empty-icon">
                  <FlagPennant size={25} />
                </span>
                <div>
                  <h3>A clean slate. An open fairway.</h3>
                  <p>
                    {session
                      ? 'Your rounds will show up here once you start playing.'
                      : 'Start a round or join your friends. Your scorecard will be right here.'}
                  </p>
                </div>
                <button className="empty-button" onClick={start}>
                  Start your first round <CaretRight size={17} />
                </button>
              </div>
            )}
          </section>
          <div className="bottom-note">
            <UsersThree size={20} />
            <p>
              Everyone plays. Everyone scores.{' '}
              <span>Your group stays on the same page, hole by hole.</span>
            </p>
          </div>
        </div>
      </main>
      {modal === 'auth' && (
        <AuthModal initial="signup" close={() => setModal(null)} done={() => setModal('start')} />
      )}
      {modal === 'start' && (
        <StartModal name={session?.user.name ?? ''} close={() => setModal(null)} />
      )}
      {modal === 'join' && (
        <Modal title="You’re invited." close={() => setModal(null)}>
          <p className="modal-intro">
            Enter the code from your host and choose your name on the scorecard.
          </p>
          <JoinForm />
        </Modal>
      )}
    </Shell>
  );
}
