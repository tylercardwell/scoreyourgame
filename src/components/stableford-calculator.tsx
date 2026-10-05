'use client';
import { useState } from 'react';
import { holePoints, strokesReceived } from '@/lib/stableford';

type Row = { par: number; si: number; gross: number };
const blank = (holes: number): Row[] =>
  Array.from({ length: holes }, (_, i) => ({ par: 4, si: i + 1, gross: 0 }));
const num = (value: string, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || 0)));

export function StablefordCalculator() {
  const [holes, setHoles] = useState<9 | 18>(18),
    [handicap, setHandicap] = useState(0),
    [rows, setRows] = useState<Row[]>(() => blank(18));
  const update = (index: number, patch: Partial<Row>) =>
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const choose = (count: 9 | 18) => {
    setHoles(count);
    setRows((previous) =>
      Array.from({ length: count }, (_, i) => previous[i] ?? { par: 4, si: i + 1, gross: 0 }).map(
        (row, i) => ({ ...row, si: Math.min(row.si, count) || i + 1 }),
      ),
    );
  };
  const detail = rows.map((row) => {
    const received = strokesReceived(handicap, row.si, holes);
    return {
      received,
      net: row.gross ? row.gross - received : null,
      points: holePoints(row.par, row.gross, received),
    };
  });
  const points = detail.reduce((n, d) => n + d.points, 0);
  const played = rows.filter((r) => r.gross).length;
  const gross = rows.reduce((n, r) => n + r.gross, 0);
  const target = holes === 18 ? 36 : 18;
  const dupes = new Set(rows.map((r) => r.si)).size !== rows.length;
  return (
    <div className="calc">
      <div className="calc-controls">
        <fieldset>
          <legend>Holes</legend>
          {([18, 9] as const).map((n) => (
            <button
              type="button"
              key={n}
              className={holes === n ? 'calc-pill selected' : 'calc-pill'}
              aria-pressed={holes === n}
              onClick={() => choose(n)}
            >
              {n}
            </button>
          ))}
        </fieldset>
        <label>
          Playing handicap{holes === 9 ? ' (for 9 holes)' : ''}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={54}
            value={handicap || ''}
            placeholder="0"
            onChange={(e) => setHandicap(num(e.target.value, 0, 54))}
          />
        </label>
      </div>
      <div className="calc-scroll">
        <table className="calc-table">
          <thead>
            <tr>
              <th>Hole</th>
              <th>Par</th>
              <th>Stroke index</th>
              <th>Your score</th>
              <th>Strokes received</th>
              <th>Net</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{i + 1}</th>
                <td>
                  <select
                    aria-label={`Par for hole ${i + 1}`}
                    value={row.par}
                    onChange={(e) => update(i, { par: Number(e.target.value) })}
                  >
                    {[3, 4, 5, 6].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label={`Stroke index for hole ${i + 1}`}
                    min={1}
                    max={holes}
                    value={row.si}
                    onChange={(e) => update(i, { si: num(e.target.value, 1, holes) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label={`Score for hole ${i + 1}`}
                    min={1}
                    max={20}
                    value={row.gross || ''}
                    placeholder="–"
                    onChange={(e) => update(i, { gross: num(e.target.value, 0, 20) })}
                  />
                </td>
                <td>{detail[i].received}</td>
                <td>{detail[i].net ?? '–'}</td>
                <td className="calc-points">{detail[i].points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dupes && (
        <p className="calc-note">
          Two holes share the same stroke index. Check your scorecard, as each number should be used
          once.
        </p>
      )}
      <div className="calc-total" role="status" aria-live="polite">
        <div>
          <span>Stableford points</span>
          <strong>{points}</strong>
        </div>
        <div>
          <span>Gross strokes</span>
          <strong>{played ? gross : '–'}</strong>
        </div>
        <div>
          <span>Holes scored</span>
          <strong>
            {played}/{holes}
          </strong>
        </div>
        <div>
          <span>Vs. {target} points</span>
          <strong>{played ? (points - target > 0 ? '+' : '') + (points - target) : '–'}</strong>
        </div>
      </div>
    </div>
  );
}
