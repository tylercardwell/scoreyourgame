import type { Metadata } from 'next';
import Link from 'next/link';
import { Article, type Faq } from '@/components/article';
import { PrintButton } from '@/components/print-button';

const title = 'Printable Golf Scorecard: Free 18-Hole Template for 4 Players';
const description =
  'A free printable golf scorecard for 18 holes and up to four players, with front nine, back nine and total columns. Print it or save it as a PDF, or score online for free.';
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/printable-golf-scorecard' },
  openGraph: { title, description, type: 'article', url: '/printable-golf-scorecard' },
};

const faqs: Faq[] = [
  {
    q: 'How do I save the scorecard as a PDF?',
    a: 'Choose “Print this scorecard”, then pick “Save as PDF” as the destination in your browser’s print dialog.',
  },
  {
    q: 'Can I print it for 9 holes?',
    a: 'Yes. Use only the front nine (holes 1 to 9) and the OUT column, and ignore the back nine.',
  },
  {
    q: 'What do OUT, IN and TOT mean?',
    a: 'OUT is your total for the front nine, IN is your total for the back nine, and TOT is the two added together.',
  },
  {
    q: 'Is there a way to skip the pencil?',
    a: 'Yes. ScoreYourGame is a free online scorecard where your whole group enters scores on their own phones and sees one live leaderboard.',
  },
];

const front = Array.from({ length: 9 }, (_, i) => i + 1);
const back = Array.from({ length: 9 }, (_, i) => i + 10);
const players = [1, 2, 3, 4];

function Nine({ holes, label }: { holes: number[]; label: 'OUT' | 'IN' }) {
  return (
    <table className="print-card">
      <thead>
        <tr>
          <th>Hole</th>
          {holes.map((h) => (
            <th key={h}>{h}</th>
          ))}
          <th>{label}</th>
        </tr>
        <tr>
          <th>Par</th>
          {holes.map((h) => (
            <td key={h} />
          ))}
          <td />
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={p}>
            <th>Player {p}</th>
            {holes.map((h) => (
              <td key={h} />
            ))}
            <td />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Page() {
  return (
    <Article
      path="/printable-golf-scorecard"
      eyebrow="Printable template"
      title="Printable golf scorecard"
      intro="A clean 18-hole scorecard for up to four players. Print it, or save it as a PDF, and take it to the course."
      faqs={faqs}
    >
      <section aria-labelledby="card">
        <h2 id="card">18-hole scorecard</h2>
        <p className="no-print">
          Write the course’s par for each hole in the Par row, then add up each nine as you play.
        </p>
        <div className="print-sheet">
          <p className="print-meta">Course: ______________________ &nbsp; Date: ______________</p>
          <Nine holes={front} label="OUT" />
          <Nine holes={back} label="IN" />
          <p className="print-meta">Total (OUT + IN): ____________ &nbsp; Signed: ______________</p>
        </div>
        <div className="article-cta no-print">
          <PrintButton />
        </div>
      </section>
      <section aria-labelledby="digital" className="no-print">
        <h2 id="digital">Prefer to skip the paper?</h2>
        <p>
          <Link href="/free-golf-scorecard">ScoreYourGame</Link> is a free online scorecard. Start a
          round, share a code, and everyone enters their own scores while the leaderboard updates
          live. New to scoring? Read{' '}
          <Link href="/how-to-keep-score-in-golf">how to keep score in golf</Link>.
        </p>
      </section>
    </Article>
  );
}
