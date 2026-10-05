'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CaretDown, Check } from '@phosphor-icons/react';
import { api, Modal, Busy, ErrorMessage } from './ui';
type CourseHit = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  par: number | null;
  holeCount: number | null;
  pars: number[] | null;
};
export function StartModal({ close, name }: { close: () => void; name: string }) {
  const router = useRouter();
  const [count, setCount] = useState<9 | 18>(18),
    [pars, setPars] = useState(Array<number>(18).fill(4)),
    [settings, setSettings] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [course, setCourse] = useState(''),
    [hits, setHits] = useState<CourseHit[]>([]),
    [picked, setPicked] = useState(false),
    [note, setNote] = useState('');
  useEffect(() => {
    if (picked || course.trim().length < 3) return;
    let live = true;
    const timer = setTimeout(() => {
      api<{ courses: CourseHit[] }>(`/api/courses?q=${encodeURIComponent(course)}`)
        .then((result) => live && setHits(result.courses))
        .catch(() => live && setHits([]));
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [course, picked]);
  const showHits = !picked && course.trim().length >= 3 && hits.length > 0;
  async function pick(hit: CourseHit) {
    setPicked(true);
    setHits([]);
    setCourse(hit.name);
    setNote('');
    try {
      const { course: full } = await api<{ course: CourseHit }>(`/api/courses/${hit.id}`);
      if (full.pars?.length) {
        const holes = full.pars.length >= 18 ? 18 : 9;
        setCount(holes);
        setPars(Array.from({ length: 18 }, (_, i) => full.pars?.[i % holes] ?? 4));
        setNote(`Loaded pars for ${full.name}. Adjust any hole if it looks off.`);
      } else {
        setNote('No hole-by-hole pars on file for this course yet. Set them below if you like.');
      }
    } catch {
      setNote('Could not load pars for this course. You can set them below.');
    }
  }
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
        <div className="course-field">
          <label htmlFor="course-input">Course</label>
          <input
            id="course-input"
            name="course"
            required
            minLength={2}
            maxLength={100}
            placeholder="Search or type a course name"
            autoComplete="off"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setPicked(false);
              setNote('');
            }}
          />
          {showHits && (
            <ul className="course-hits" aria-label="Matching courses">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button type="button" onClick={() => pick(hit)}>
                    <span>{hit.name}</span>
                    <span>{[hit.city, hit.state].filter(Boolean).join(', ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <span className="field-note">
            {note || 'Search to load pars.'} Course data © OpenStreetMap contributors via{' '}
            <a href="https://opengolfapi.org/attribution" target="_blank" rel="noreferrer">
              OpenGolfAPI
            </a>
            .
          </span>
        </div>
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
