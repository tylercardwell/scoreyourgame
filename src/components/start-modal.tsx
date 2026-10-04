'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CaretDown, Check } from '@phosphor-icons/react';
import { api, Modal, Busy, ErrorMessage } from './ui';
export function StartModal({ close, name }: { close: () => void; name: string }) {
  const router = useRouter();
  const [count, setCount] = useState<9 | 18>(18),
    [pars, setPars] = useState(Array<number>(18).fill(4)),
    [settings, setSettings] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    try {
      const result = await api<{ id: string }>('/api/rounds', 'POST', {
        name: data.get('name'),
        course: data.get('course'),
        nickname: data.get('nickname'),
        holeCount: count,
        pars: pars.slice(0, count),
      });
      router.push(`/round/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the round.');
      setBusy(false);
    }
  }
  return (
    <Modal title="A fresh scorecard." close={close} wide>
      <p className="modal-intro">Just you or the whole group. Let’s get you out there.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Round name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue="A day on the course"
            placeholder="Saturday with the crew"
          />
        </label>
        <label>
          Course
          <input
            name="course"
            required
            minLength={2}
            maxLength={100}
            placeholder="Where are you playing?"
          />
        </label>
        <label>
          Your name on the scorecard
          <input name="nickname" required minLength={2} maxLength={30} defaultValue={name} />
        </label>
        <fieldset className="choice-field">
          <legend>How many holes?</legend>
          <div className="hole-choices">
            {([9, 18] as const).map((n) => (
              <button
                type="button"
                className={count === n ? 'hole-choice selected' : 'hole-choice'}
                onClick={() => setCount(n)}
                key={n}
              >
                <span>{n} holes</span>
                <span>{n === 9 ? 'A quick round' : 'The full round'}</span>
                {count === n && <Check size={20} />}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          className="settings-toggle"
          aria-expanded={settings}
          onClick={() => setSettings(!settings)}
        >
          Set hole pars{' '}
          <span>
            Par {pars.slice(0, count).reduce((a, b) => a + b, 0)} <CaretDown size={16} />
          </span>
        </button>
        {settings ? (
          <div className="par-grid">
            {pars.slice(0, count).map((par, index) => (
              <label key={index}>
                Hole {index + 1}
                <select
                  aria-label={`Par for hole ${index + 1}`}
                  value={par}
                  onChange={(e) =>
                    setPars((previous) =>
                      previous.map((p, i) => (i === index ? Number(e.target.value) : p)),
                    )
                  }
                >
                  {[3, 4, 5, 6].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : (
          <p className="field-note">
            Pars start at 4. You can adjust them now or during the round.
          </p>
        )}
        <ErrorMessage message={error} />
        <button className="button primary full" disabled={busy}>
          {busy ? (
            <Busy text="Creating your round" />
          ) : (
            <>
              Start round <ArrowRight size={19} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
