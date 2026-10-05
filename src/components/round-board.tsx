'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  PencilSimple,
  ShareNetwork,
  UsersThree,
  FlagPennant,
  Trophy,
} from '@phosphor-icons/react';
import { relative, total, type Round, type Player } from '@/lib/types';
import { Busy, ErrorMessage } from './ui';

type Props = {
  round: Round;
  me: Player;
  hole: number;
  value: number;
  editing: boolean;
  busy: boolean;
  error: string;
  online: boolean;
  tab: 'score' | 'card';
  holeStrip: RefObject<HTMLDivElement | null>;
  go: (hole: number) => void;
  adjust: (delta: number) => void;
  save: (strokes: number | null) => Promise<void>;
  setTab: (tab: 'score' | 'card') => void;
  invite: () => void;
  finish: () => void;
  editPar: () => void;
};

export function RoundBoard({
  round,
  me,
  hole,
  value,
  editing,
  busy,
  error,
  online,
  tab,
  holeStrip,
  go,
  adjust,
  save,
  setTab,
  invite,
  finish,
  editPar,
}: Props) {
  const complete = round.status === 'completed';
  const current = round.holes.find((h) => h.number === hole)!;
  const saved = me.scores[hole];
  const summary = total(me, round.holes);
  const coursePar = round.holes.reduce((sum, h) => sum + h.par, 0);
  const standings = round.players
    .map((player) => ({ player, ...total(player, round.holes) }))
    .sort((a, b) => Number(a.played === 0) - Number(b.played === 0) || a.toPar - b.toPar);

  return (
    <main className="round-page">
      <section className="round-hero" aria-labelledby="round-title">
        <Image
          src="/round-course-banner.png"
          alt="Rolling golf fairways and a pond surrounded by trees in afternoon light"
          fill
          priority
          sizes="100vw"
          className="round-hero-image"
        />
        <div className="round-hero-shade" />
        <div className="round-content round-hero-content">
          <div className="round-hero-copy">
            <Link href="/rounds" className="round-back">
              <ArrowLeft size={20} />
              Your rounds
            </Link>
            <h1 id="round-title">{round.name}</h1>
            <p>
              {round.course}
              <span aria-hidden="true">·</span>
              <time dateTime={round.createdAt}>
                {new Date(round.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </p>
          </div>
          {!complete && (
            <button className="button round-invite" onClick={invite}>
              <ShareNetwork size={22} />
              Invite players
            </button>
          )}
        </div>
      </section>

      <div className="round-content round-workspace">
        <div className="round-view-rail">
          <div className="round-view-tabs" role="tablist" aria-label="Round view">
            <button
              id="play-round-tab"
              role="tab"
              aria-selected={tab === 'score'}
              aria-controls="play-round-panel"
              className={tab === 'score' ? 'selected' : ''}
              onClick={() => setTab('score')}
            >
              Play the round
            </button>
            <button
              id="full-card-tab"
              role="tab"
              aria-selected={tab === 'card'}
              aria-controls="full-card-panel"
              className={tab === 'card' ? 'selected' : ''}
              onClick={() => setTab('card')}
            >
              Full scorecard
            </button>
          </div>
          <div className="round-status-info">
            <span
              className={`live-status ${online || complete ? 'connected' : ''}`}
              aria-live="polite"
            >
              <span className="connection-dot" aria-hidden="true" />
              {complete ? 'Round complete' : online ? 'Live scorecard' : 'Reconnecting'}
            </span>
            <span className="player-count">
              <UsersThree size={20} />
              {round.players.length} {round.players.length === 1 ? 'player' : 'players'}
            </span>
          </div>
        </div>

        {tab === 'score' ? (
          <section id="play-round-panel" role="tabpanel" aria-labelledby="play-round-tab">
            <div className="round-hole-scroll" ref={holeStrip}>
              <table className="round-hole-table" aria-label="Hole selection and course pars">
                <thead>
                  <tr>
                    <th scope="row">Hole</th>
                    {round.holes.map((h) => (
                      <th
                        scope="col"
                        key={h.number}
                        className={hole === h.number ? 'selected-hole' : ''}
                      >
                        <button
                          data-hole={h.number}
                          aria-label={`Hole ${h.number}${me.scores[h.number] !== undefined ? `, ${me.scores[h.number]} strokes` : ''}`}
                          aria-current={hole === h.number ? 'step' : undefined}
                          disabled={busy}
                          onClick={() => go(h.number)}
                        >
                          {h.number}
                          {me.scores[h.number] !== undefined && (
                            <Check size={11} className="hole-saved-check" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                    ))}
                    <th scope="col" className="course-total">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Par</th>
                    {round.holes.map((h) => (
                      <td key={h.number}>{h.par}</td>
                    ))}
                    <td className="course-total">{coursePar}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="round-play-grid">
              <section className="round-hole-context" aria-label="Current hole">
                <h2 aria-label={`Hole ${String(hole).padStart(2, '0')} / ${round.holeCount}`}>
                  Hole {String(hole).padStart(2, '0')}
                </h2>
                <span className="hole-of">of {round.holeCount}</span>
                <div className="round-par-control">
                  <button
                    className="par-button"
                    disabled={!round.isHost || complete || busy}
                    onClick={editPar}
                  >
                    Par {current.par}
                    {round.isHost && !complete && <PencilSimple size={19} />}
                  </button>
                </div>
              </section>

              <section className="round-stroke-entry" aria-label="Your score entry">
                <div className="score-entry">
                  <span className="score-caption">
                    {complete
                      ? 'YOUR SCORE'
                      : saved !== undefined && !editing
                        ? 'YOUR SAVED SCORE'
                        : 'YOUR STROKES'}
                  </span>
                  <div className="stroke-controls">
                    <button
                      className="stroke-button"
                      aria-label="Decrease strokes"
                      disabled={busy || complete || value <= 1}
                      onClick={() => adjust(-1)}
                    >
                      <Minus size={34} weight="bold" />
                    </button>
                    <div className="stroke-value">
                      <strong aria-live="polite" aria-label={`${value} strokes`}>
                        {value}
                      </strong>
                    </div>
                    <button
                      className="stroke-button"
                      aria-label="Increase strokes"
                      disabled={busy || complete || value >= 30}
                      onClick={() => adjust(1)}
                    >
                      <Plus size={34} weight="bold" />
                    </button>
                  </div>
                  <p className="score-hint">
                    {complete
                      ? 'This round is complete. Your scores are saved.'
                      : saved !== undefined && !editing
                        ? 'Saved to everyone’s scorecard. Tap to adjust.'
                        : 'Count every stroke. Tap to set your score.'}
                  </p>
                  <ErrorMessage message={error} />
                  {!complete && (
                    <>
                      <button
                        className="button primary save-score"
                        disabled={busy}
                        onClick={() => save(value)}
                      >
                        {busy ? (
                          <Busy text="Saving score" />
                        ) : (
                          <>
                            Save score {hole < round.holeCount ? '& next hole' : ''}
                            <ArrowRight size={24} />
                          </>
                        )}
                      </button>
                      {saved !== undefined && (
                        <button
                          className="text-button clear-score"
                          disabled={busy}
                          onClick={() => save(null)}
                        >
                          Clear this hole’s score
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="hole-navigation">
                  <button disabled={hole === 1 || busy} onClick={() => go(hole - 1)}>
                    <ArrowLeft size={22} />
                    Previous hole
                  </button>
                  <span>
                    {summary.played} of {round.holeCount} scored
                  </span>
                  <button disabled={hole === round.holeCount || busy} onClick={() => go(hole + 1)}>
                    Next hole
                    <ArrowRight size={22} />
                  </button>
                </div>
              </section>

              <aside className="round-group" aria-labelledby="group-title">
                <h2 id="group-title">Group leaderboard</h2>
                <div className="round-group-scroll">
                  <table className="round-leaderboard" aria-label="Group standings">
                    <thead>
                      <tr>
                        <th scope="col">Pos</th>
                        <th scope="col">Player</th>
                        <th scope="col">Thru</th>
                        <th scope="col">Strokes</th>
                        <th scope="col">To par</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map(({ player, strokes, played, toPar }, index) => {
                        const firstAtScore = standings.findIndex(
                          (row) => row.played > 0 && row.toPar === toPar,
                        );
                        const tied =
                          played > 0 &&
                          standings.filter((row) => row.played > 0 && row.toPar === toPar).length >
                            1;
                        return (
                          <tr
                            key={player.id}
                            className={`leaderboard-row ${player.id === me.id ? 'you' : ''}`}
                          >
                            <td>{played ? `${tied ? 'T' : ''}${firstAtScore + 1}` : index + 1}</td>
                            <th scope="row" className="leaderboard-name">
                              <div className="round-player-identity">
                                <span className="avatar" aria-hidden="true">
                                  {player.nickname.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="round-player-copy">
                                  <strong>{player.nickname}</strong>
                                  <span className="round-player-tags">
                                    {player.id === me.id && <span className="you-label">You</span>}
                                    {player.isHost && <span className="host-label">Host</span>}
                                  </span>
                                </span>
                              </div>
                              <span className="sr-only">
                                {played
                                  ? `${strokes} strokes · ${played} ${played === 1 ? 'hole' : 'holes'}`
                                  : 'Ready to tee off'}
                              </span>
                            </th>
                            <td>{played || '—'}</td>
                            <td>{played ? strokes : '—'}</td>
                            <td className={played && toPar < 0 ? 'under-par' : ''}>
                              {played ? relative(toPar) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="round-inline-summary">
                  <span>
                    <strong>{summary.played ? summary.strokes : '—'}</strong> strokes
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong>{summary.played ? relative(summary.toPar) : '—'}</strong> to par
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong>{summary.played}</strong> / {round.holeCount} holes
                  </span>
                </p>
                {!complete && round.isHost && (
                  <>
                    <button className="button round-finish" onClick={finish}>
                      <FlagPennant size={23} />
                      Finish round
                    </button>
                    <p className="round-host-note">
                      Host only. This will complete the round for all players.
                    </p>
                  </>
                )}
                {round.players.length > 1 && (
                  <p className="round-comparison-note">
                    Scores compare played holes. Players may be on different holes.
                  </p>
                )}
                {complete && (
                  <div className="completed-note">
                    <Trophy size={28} />
                    <strong>That’s a wrap.</strong>
                    <span>Your scorecard is saved.</span>
                  </div>
                )}
              </aside>
            </div>
          </section>
        ) : (
          <section
            id="full-card-panel"
            role="tabpanel"
            aria-labelledby="full-card-tab"
            className="full-scorecard round-full-scorecard"
          >
            <div className="scorecard-title">
              <h2>Every hole. Every player.</h2>
              <span>Par {coursePar}</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Player</th>
                    {round.holes.map((h) => (
                      <th key={h.number} scope="col">
                        {h.number}
                      </th>
                    ))}
                    <th scope="col">Total</th>
                    <th scope="col">+/−</th>
                  </tr>
                  <tr className="par-row">
                    <th scope="row">Par</th>
                    {round.holes.map((h) => (
                      <td key={h.number}>{h.par}</td>
                    ))}
                    <td>{coursePar}</td>
                    <td />
                  </tr>
                </thead>
                <tbody>
                  {round.players.map((player) => {
                    const stats = total(player, round.holes);
                    return (
                      <tr key={player.id} className={player.id === me.id ? 'your-row' : ''}>
                        <th scope="row">
                          {player.nickname}
                          {player.id === me.id && <small>You</small>}
                        </th>
                        {round.holes.map((h) => (
                          <td key={h.number}>
                            {player.id === me.id ? (
                              <button
                                className={player.scores[h.number] < h.par ? 'table-under' : ''}
                                aria-label={`${complete ? 'View' : 'Edit'} your score for hole ${h.number}`}
                                onClick={() => {
                                  go(h.number);
                                  setTab('score');
                                }}
                              >
                                {player.scores[h.number] ?? '·'}
                              </button>
                            ) : (
                              <span
                                className={player.scores[h.number] < h.par ? 'table-under' : ''}
                              >
                                {player.scores[h.number] ?? '·'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="table-total">{stats.played ? stats.strokes : '—'}</td>
                        <td className="table-total">
                          {stats.played ? relative(stats.toPar) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="field-note">
              {complete
                ? 'Final scores. A dot means the hole hasn’t been scored.'
                : 'Tap your own score to edit it. A dot means the hole hasn’t been scored yet.'}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
