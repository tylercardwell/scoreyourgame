'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Minus,
  Plus,
  Check,
  ShareNetwork,
  Trophy,
  UsersThree,
  WifiHigh,
  WifiSlash,
  PencilSimple,
  FlagPennant,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { type Round, total, relative } from '@/lib/types';
import { api, Busy, ErrorMessage, Modal } from './ui';
import { Shell } from './shell';
import { InviteModal } from './invite-modal';

export function Scorecard({ id }: { id: string }) {
  const [round, setRound] = useState<Round | null>(null),
    [hole, setHole] = useState(1),
    [draft, setDraft] = useState(4),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [loadError, setLoadError] = useState(''),
    [online, setOnline] = useState(false),
    [invite, setInvite] = useState(false),
    [finish, setFinish] = useState(false),
    [parOpen, setParOpen] = useState(false),
    [tab, setTab] = useState<'score' | 'card'>('score');
  const initialized = useRef(false),
    holeStrip = useRef<HTMLDivElement>(null);
  const apply = (data: Round) =>
    setRound((previous) => (!previous || data.revision >= previous.revision ? data : previous));
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const data = await api<Round>(`/api/rounds/${id}`);
        if (active) {
          apply(data);
          setLoadError('');
        }
      } catch (e) {
        if (active && !initialized.current)
          setLoadError(e instanceof Error ? e.message : 'Unable to load round.');
      }
    };
    void refresh();
    const stream = new EventSource(`/api/rounds/${id}/events`);
    stream.onmessage = (event) => {
      if (active) {
        try {
          apply(JSON.parse(event.data));
          setOnline(true);
        } catch {}
      }
    };
    stream.onerror = () => {
      if (active) setOnline(false);
    };
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 10000);
    const focus = () => {
      void refresh();
    };
    window.addEventListener('online', focus);
    document.addEventListener('visibilitychange', focus);
    return () => {
      active = false;
      stream.close();
      clearInterval(interval);
      window.removeEventListener('online', focus);
      document.removeEventListener('visibilitychange', focus);
    };
  }, [id]);
  useEffect(() => {
    if (round && !initialized.current) {
      initialized.current = true;
      const me = round.players.find((p) => p.id === round.viewerId);
      const next = round.holes.find((h) => me?.scores[h.number] === undefined)?.number ?? 1;
      setHole(next);
    }
  }, [round]);
  useEffect(() => {
    holeStrip.current
      ?.querySelector(`[data-hole="${hole}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [hole]);
  const me = round?.players.find((p) => p.id === round.viewerId);
  const current = round?.holes.find((h) => h.number === hole);
  const saved = me?.scores[hole];
  // A local edit stays local until Save. Live scores never overwrite an in-progress edit.
  const value = editing ? draft : (saved ?? current?.par ?? 4);
  const myTotal = me && round ? total(me, round.holes) : null;
  function go(next: number) {
    setHole(next);
    setEditing(false);
    setError('');
  }
  function adjust(delta: number) {
    setDraft(Math.max(1, Math.min(30, value + delta)));
    setEditing(true);
  }
  async function save(strokes: number | null) {
    setBusy(true);
    setError('');
    try {
      const data = await api<Round>(`/api/rounds/${id}/scores`, 'PUT', { hole, strokes });
      apply(data);
      setEditing(false);
      if (strokes !== null && hole < data.holeCount) go(hole + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  if (loadError && !round)
    return (
      <Shell compact>
        <main className="not-found">
          <FlagPennant size={40} />
          <h1>Let’s get you to your round.</h1>
          <ErrorMessage message={loadError} />
          <Link href="/join" className="button primary">
            Join with an invitation code <ArrowRight size={18} />
          </Link>
          <Link href="/" className="subtle-link">
            Back home
          </Link>
        </main>
      </Shell>
    );
  if (!round || !me || !current || !myTotal)
    return (
      <Shell compact>
        <main className="loading-panel container">
          <Busy text="Opening your scorecard" />
        </main>
      </Shell>
    );
  const leaderboard = [...round.players].sort((a, b) => {
    const at = total(a, round.holes),
      bt = total(b, round.holes);
    return (at.played === 0 ? 1 : 0) - (bt.played === 0 ? 1 : 0) || at.toPar - bt.toPar;
  });
  const complete = round.status === 'completed';
  return (
    <Shell compact>
      <main className="container game-page">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          Your rounds
        </Link>
        <div className="game-heading">
          <div>
            <div className="game-eyebrow">
              <span className={`live-status ${online ? 'connected' : ''}`}>
                {complete ? (
                  <Check size={14} />
                ) : online ? (
                  <WifiHigh size={14} />
                ) : (
                  <WifiSlash size={14} />
                )}{' '}
                {complete ? 'Round complete' : online ? 'Live scorecard' : 'Reconnecting'}
              </span>
              <span>
                {round.holeCount} holes <span className="meta-divider">/</span> Par{' '}
                {round.holes.reduce((n, h) => n + h.par, 0)}
              </span>
            </div>
            <h1>{round.name}</h1>
            <p>
              {round.course} <span>·</span>{' '}
              {new Date(round.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          {!complete && (
            <button className="button secondary invite-button" onClick={() => setInvite(true)}>
              <ShareNetwork size={19} />
              Invite players
            </button>
          )}
        </div>
        <div className="game-tabs tabs">
          <button className={tab === 'score' ? 'selected' : ''} onClick={() => setTab('score')}>
            Play the round
          </button>
          <button className={tab === 'card' ? 'selected' : ''} onClick={() => setTab('card')}>
            Full scorecard
          </button>
          <span className="player-count">
            <UsersThree size={18} />
            {round.players.length} {round.players.length === 1 ? 'player' : 'players'}
          </span>
        </div>
        {tab === 'score' ? (
          <div className="game-layout">
            <section className="scoring-panel">
              <div className="hole-strip" ref={holeStrip} aria-label="Select a hole">
                {round.holes.map((h) => (
                  <button
                    data-hole={h.number}
                    key={h.number}
                    className={`hole-dot ${hole === h.number ? 'current' : ''} ${me.scores[h.number] !== undefined ? 'scored' : ''}`}
                    aria-label={`Hole ${h.number}${me.scores[h.number] !== undefined ? `, ${me.scores[h.number]} strokes` : ''}`}
                    aria-current={hole === h.number ? 'step' : undefined}
                    disabled={busy}
                    onClick={() => go(h.number)}
                  >
                    {h.number}
                    <span>
                      {me.scores[h.number] !== undefined ? <Check size={10} weight="bold" /> : ''}
                    </span>
                  </button>
                ))}
              </div>
              <div className="hole-heading">
                <div>
                  <p className="eyebrow">{hole <= 9 ? 'FRONT NINE' : 'BACK NINE'}</p>
                  <h2>
                    Hole {String(hole).padStart(2, '0')}
                    <span> / {round.holeCount}</span>
                  </h2>
                </div>
                <button
                  className="par-button"
                  disabled={!round.isHost || complete}
                  onClick={() => setParOpen(true)}
                >
                  Par {current.par}
                  {round.isHost && !complete && <PencilSimple size={13} />}
                </button>
              </div>
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
                    <Minus size={25} />
                  </button>
                  <div className="stroke-value">
                    <strong>{value}</strong>
                    <span>
                      {relative(value - current.par) === 'E'
                        ? 'Par'
                        : value - current.par === -1
                          ? 'Birdie'
                          : value - current.par === -2
                            ? 'Eagle'
                            : value - current.par === 1
                              ? 'Bogey'
                              : `${relative(value - current.par)} to par`}
                    </span>
                  </div>
                  <button
                    className="stroke-button"
                    aria-label="Increase strokes"
                    disabled={busy || complete || value >= 30}
                    onClick={() => adjust(1)}
                  >
                    <Plus size={25} />
                  </button>
                </div>
                <p className="score-hint">
                  {complete
                    ? 'This round is complete. Nice work out there.'
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
                      ) : saved !== undefined && !editing ? (
                        <>
                          {hole < round.holeCount ? 'Save & next hole' : 'Save score'}{' '}
                          {hole < round.holeCount ? <ArrowRight size={18} /> : <Check size={18} />}
                        </>
                      ) : (
                        <>
                          Save score {hole < round.holeCount ? '& next hole' : ''}{' '}
                          <Check size={19} />
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
                  <CaretLeft size={17} />
                  Previous hole
                </button>
                <span>
                  {myTotal.played} of {round.holeCount} scored
                </span>
                <button disabled={hole === round.holeCount || busy} onClick={() => go(hole + 1)}>
                  Next hole
                  <CaretRight size={17} />
                </button>
              </div>
            </section>
            <aside className="leaderboard-panel">
              <div className="leaderboard-heading">
                <div>
                  <h2>The group</h2>
                  <p>Gross scores against par</p>
                </div>
                <Trophy size={23} />
              </div>
              <div className="leaderboard-list">
                {leaderboard.map((player, index) => {
                  const stats = total(player, round.holes);
                  return (
                    <div
                      className={`leaderboard-row ${player.id === me.id ? 'you' : ''}`}
                      key={player.id}
                    >
                      <span className="rank">{stats.played ? index + 1 : '·'}</span>
                      <span className={`avatar avatar-${index % 4}`}>
                        {player.nickname.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="leaderboard-name">
                        <strong>
                          {player.nickname}
                          {player.id === me.id && <span className="you-label">You</span>}
                        </strong>
                        <span>
                          {stats.played
                            ? `${stats.strokes} strokes · ${stats.played} ${stats.played === 1 ? 'hole' : 'holes'}`
                            : 'Ready to tee off'}
                          {player.isHost ? ' · Host' : ''}
                        </span>
                      </div>
                      <strong className={`to-par ${stats.toPar < 0 ? 'under-par' : ''}`}>
                        {stats.played ? relative(stats.toPar) : '—'}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <div className="your-summary">
                <span>Your round so far</span>
                <div>
                  <div>
                    <strong>{myTotal.played ? myTotal.strokes : '—'}</strong>
                    <span>Strokes</span>
                  </div>
                  <div>
                    <strong>{myTotal.played ? relative(myTotal.toPar) : '—'}</strong>
                    <span>To par</span>
                  </div>
                  <div>
                    <strong>
                      {myTotal.played}
                      <small>/{round.holeCount}</small>
                    </strong>
                    <span>Holes played</span>
                  </div>
                </div>
              </div>
              <p className="leaderboard-note">
                Scores compare played holes. Players may be on different holes.
              </p>
              {!complete && round.isHost && (
                <button className="button secondary full" onClick={() => setFinish(true)}>
                  <FlagPennant size={18} />
                  Finish round
                </button>
              )}
              {complete && (
                <div className="completed-note">
                  <Trophy size={25} weight="duotone" />
                  <strong>That’s a wrap.</strong>
                  <span>Your scorecard is saved.</span>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <section className="full-scorecard">
            <div className="scorecard-title">
              <h2>Every hole. Every player.</h2>
              <span>Par {round.holes.reduce((n, h) => n + h.par, 0)}</span>
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
                    <td>{round.holes.reduce((n, h) => n + h.par, 0)}</td>
                    <td></td>
                  </tr>
                </thead>
                <tbody>
                  {round.players.map((player) => {
                    const stats = total(player, round.holes);
                    return (
                      <tr className={player.id === me.id ? 'your-row' : ''} key={player.id}>
                        <th scope="row">
                          {player.nickname}
                          {player.id === me.id && <small>You</small>}
                        </th>
                        {round.holes.map((h) => (
                          <td key={h.number}>
                            {player.id === me.id ? (
                              <button
                                className={player.scores[h.number] < h.par ? 'table-under' : ''}
                                aria-label={`Edit your score for hole ${h.number}`}
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
              Tap your own score to edit it. A dot means the hole hasn’t been scored yet.
            </p>
          </section>
        )}
        <div className="game-bottom">
          <span>
            <Check size={15} /> {complete ? 'Final scores saved' : 'Scores save after you tap Save'}
          </span>
          <span>
            <ArrowsClockwise size={15} />{' '}
            {online ? 'Your group’s scores update live' : 'Refreshing scores while reconnecting'}
          </span>
        </div>
      </main>
      {invite && <InviteModal code={round.inviteCode} close={() => setInvite(false)} />}
      {finish && (
        <Modal title="Ready to call it a round?" close={() => setFinish(false)}>
          <p className="modal-intro">
            Everyone needs a score for every hole. Finishing saves the final results and closes
            score editing for the whole group.
          </p>
          <ErrorMessage message={error} />
          <div className="form-stack">
            <button
              className="button primary full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  apply(await api<Round>(`/api/rounds/${id}`, 'PATCH', {}));
                  setFinish(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Unable to finish.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                <Busy />
              ) : (
                <>
                  Finish round <FlagPennant size={18} />
                </>
              )}
            </button>
            <button
              className="button secondary full"
              onClick={() => {
                setFinish(false);
                setError('');
              }}
            >
              Keep playing
            </button>
          </div>
        </Modal>
      )}
      {parOpen && (
        <Modal title={`Par for hole ${hole}`} close={() => setParOpen(false)}>
          <p className="modal-intro">
            Use the par from the course scorecard. This updates the whole group’s comparison to par.
          </p>
          <div className="par-choices">
            {[3, 4, 5, 6].map((par) => (
              <button
                key={par}
                className={`button ${current.par === par ? 'primary' : 'secondary'}`}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    apply(await api<Round>(`/api/rounds/${id}/holes`, 'PUT', { hole, par }));
                    setParOpen(false);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Unable to update par.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {par}
              </button>
            ))}
          </div>
          <ErrorMessage message={error} />
        </Modal>
      )}
    </Shell>
  );
}
