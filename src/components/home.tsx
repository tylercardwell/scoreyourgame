'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  FlagPennant,
  QrCode,
  UsersThree,
  Check,
  Plus,
  CaretRight,
} from '@phosphor-icons/react';
import { authClient } from '@/lib/auth-client';
import type { RoundSummary } from '@/lib/types';
import { Shell } from './shell';
import { api, Modal, ErrorMessage } from './ui';
import { AuthModal } from './auth-modal';
import { StartModal } from './start-modal';
import { JoinForm } from './join-form';
import { RoundList } from './round-list';
export function Home() {
  const { data: session } = authClient.useSession();
  const [modal, setModal] = useState<'auth' | 'start' | 'join' | null>(null),
    [rounds, setRounds] = useState<RoundSummary[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    api<RoundSummary[]>('/api/rounds')
      .then((data) => {
        if (mounted) {
          setRounds(data);
          setError('');
        }
      })
      .catch(() => {
        if (mounted)
          setError('Round history is unavailable right now. Please refresh to try again.');
      });
    return () => {
      mounted = false;
    };
  }, [session?.user.id]);
  return (
    <Shell>
      <main className="home container">
        <div className="page-greeting">
          <span>
            {session
              ? `Good to see you, ${session.user.name.split(' ')[0]}.`
              : 'A little less admin. A lot more golf.'}
          </span>
          <span className="greeting-right">
            <FlagPennant size={16} /> Your game. Your group.
          </span>
        </div>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">KEEP THE ROUND SIMPLE</p>
            <h1>
              Less scorekeeping.
              <br />
              <span>More golf.</span>
            </h1>
            <p className="hero-description">
              One scorecard for the whole group.
              <br />
              Start a round, invite your friends, and play.
            </p>
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
          <div className="hero-photo">
            <Image
              src="/course.jpg"
              alt="A golfer driving from the tee with trees and a cloudy sky behind him"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <div className="photo-caption">
              <span>Leave the pencil at home.</span>
              <FlagPennant size={23} weight="fill" />
            </div>
          </div>
        </section>
        <section className="play-actions" aria-label="Play golf">
          <button
            className="action-card start-card"
            onClick={() => setModal(session ? 'start' : 'auth')}
          >
            <div className="action-icon">
              <FlagPennant size={27} weight="duotone" />
            </div>
            <div className="action-copy">
              <h2>Start a round</h2>
              <p>
                A solo round or a friendly fourball.
                <br />
                Your next game starts here.
              </p>
              <span className="action-cta">
                Let’s play <ArrowRight size={19} />
              </span>
            </div>
            <Plus className="action-corner" size={23} />
          </button>
          <button className="action-card join-card" onClick={() => setModal('join')}>
            <div className="action-icon">
              <QrCode size={27} />
            </div>
            <div className="action-copy">
              <h2>Join your group</h2>
              <p>
                Got an invitation? Enter your code.
                <br />
                No account needed.
              </p>
              <span className="action-cta">
                Join a round <ArrowRight size={19} />
              </span>
            </div>
            <ArrowUpRight className="action-corner" size={23} />
          </button>
        </section>
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
              <button className="empty-button" onClick={() => setModal(session ? 'start' : 'auth')}>
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
