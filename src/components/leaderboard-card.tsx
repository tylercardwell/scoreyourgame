'use client';
import { relative, total, type Round } from '@/lib/types';

type Row = { id: string; name: string; toPar: number | null; thru: number; strokes: number | null };

const SAMPLE: Row[] = [
  { id: 's1', name: 'Mike R.', toPar: -3, thru: 11, strokes: 41 },
  { id: 's2', name: 'Tyler C.', toPar: -1, thru: 11, strokes: 43 },
  { id: 's3', name: 'Dana K.', toPar: -1, thru: 10, strokes: 42 },
  { id: 's4', name: 'Sam P.', toPar: 0, thru: 11, strokes: 44 },
];

function standings(round: Round): Row[] {
  return round.players
    .map((player) => {
      const t = total(player, round.holes);
      return {
        id: player.id,
        name: player.nickname,
        toPar: t.played ? t.toPar : null,
        thru: t.played,
        strokes: t.played ? t.strokes : null,
      };
    })
    .sort((a, b) => (a.toPar ?? Infinity) - (b.toPar ?? Infinity));
}

export function LeaderboardCard({ round }: { round: Round | null }) {
  const rows = round ? standings(round) : SAMPLE;
  const thru = Math.max(0, ...rows.map((r) => r.thru));
  const live = round?.status === 'active';
  const position = (row: Row) => {
    if (row.toPar === null) return '—';
    const tied = rows.filter((r) => r.toPar === row.toPar).length > 1;
    return `${tied ? 'T' : ''}${rows.findIndex((r) => r.toPar === row.toPar) + 1}`;
  };
  return (
    <section
      className="lb-card"
      aria-label={round ? `Leaderboard for ${round.name}` : 'Sample leaderboard'}
    >
      <header className="lb-head">
        <b>{round ? round.name : 'Saturday with the crew'}</b>
        {round ? (
          <span className={live ? 'live-tag' : 'lb-final'}>
            {live ? `Live · Thru ${thru}` : 'Final'}
          </span>
        ) : (
          <span className="lb-final">Sample</span>
        )}
      </header>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Player</th>
            <th>To par</th>
            <th>Thru</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{position(row)}</td>
              <td>{row.name}</td>
              <td className={row.toPar !== null && row.toPar < 0 ? 'under' : ''}>
                {row.toPar === null ? '—' : relative(row.toPar)}
              </td>
              <td>{row.thru || '—'}</td>
              <td>{row.strokes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="lb-foot">
        <span>{round ? round.course : 'Your round could look like this'}</span>
        <span>{round ? `${round.holeCount} holes` : 'Start one to go live'}</span>
      </footer>
    </section>
  );
}
