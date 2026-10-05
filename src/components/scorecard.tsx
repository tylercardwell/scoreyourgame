'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FlagPennant } from '@phosphor-icons/react';
import { type Round, total } from '@/lib/types';
import { api, Busy, ErrorMessage, Modal } from './ui';
import { Shell } from './shell';
import { InviteModal } from './invite-modal';
import { RoundBoard } from './round-board';

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
  }, [hole, tab]);
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
  return (
    <Shell variant="round">
      <RoundBoard
        round={round}
        me={me}
        hole={hole}
        value={value}
        editing={editing}
        busy={busy}
        error={error}
        online={online}
        tab={tab}
        holeStrip={holeStrip}
        go={go}
        adjust={adjust}
        save={save}
        setTab={setTab}
        invite={() => setInvite(true)}
        finish={() => setFinish(true)}
        editPar={() => setParOpen(true)}
      />
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
