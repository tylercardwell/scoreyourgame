import type { Metadata } from 'next';
import Link from 'next/link';
import { Article, type Faq } from '@/components/article';

const title = 'How to Keep Score in Golf: A Simple Beginner’s Guide';
const description =
  'Learn how to keep score in golf: counting strokes, par, birdies and bogeys, penalty strokes, and the difference between stroke play, match play and Stableford.';
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/how-to-keep-score-in-golf' },
  openGraph: { title, description, type: 'article', url: '/how-to-keep-score-in-golf' },
};

const terms = [
  ['Albatross', '3 under par', '−3'],
  ['Eagle', '2 under par', '−2'],
  ['Birdie', '1 under par', '−1'],
  ['Par', 'The hole’s target score', 'E'],
  ['Bogey', '1 over par', '+1'],
  ['Double bogey', '2 over par', '+2'],
];

const faqs: Faq[] = [
  {
    q: 'What is a good golf score for a beginner?',
    a: 'Many new golfers shoot well over par, and that is normal. Breaking 100 on 18 holes is a common first milestone, and the goal is to improve against your own previous rounds.',
  },
  {
    q: 'Do I count a missed swing?',
    a: 'Yes. A stroke is a swing made with the intention of hitting the ball. If you swing and miss, it counts as a stroke.',
  },
  {
    q: 'What is the difference between gross and net score?',
    a: 'Gross score is the number of strokes you actually took. Net score subtracts a handicap so players of different ability can compete fairly. ScoreYourGame tracks gross scores against par.',
  },
  {
    q: 'What does “to par” mean?',
    a: 'It compares your strokes with the course’s par. If par for the holes you have played is 36 and you have taken 40 strokes, you are 4 over par, written +4.',
  },
];

export default function Page() {
  return (
    <Article
      path="/how-to-keep-score-in-golf"
      eyebrow="Golf scoring basics"
      title="How to keep score in golf"
      intro="Golf scoring is simple once you know three ideas: count every stroke, compare each hole to par, and add it up. Here is everything you need to keep an accurate scorecard."
      faqs={faqs}
    >
      <section aria-labelledby="strokes">
        <h2 id="strokes">1. Count every stroke</h2>
        <p>
          Your score on a hole is the total number of strokes it took you to get the ball in the
          cup. That includes every swing you make at the ball, including a miss, and any penalty
          strokes. Write the number down after each hole, not at the end of the round.
        </p>
      </section>
      <section aria-labelledby="par">
        <h2 id="par">2. Compare each hole to par</h2>
        <p>
          Every hole has a par, usually 3, 4 or 5. Par is the number of strokes an expert golfer is
          expected to need. Your score relative to par has a name:
        </p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Meaning</th>
              <th>To par</th>
            </tr>
          </thead>
          <tbody>
            {terms.map(([name, meaning, value]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{meaning}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          An 18-hole course is commonly par 70 to 72. Add up your strokes at the end to get your
          total, and subtract the course par to get your score to par.
        </p>
      </section>
      <section aria-labelledby="penalties">
        <h2 id="penalties">3. Add penalty strokes</h2>
        <p>
          Some situations add strokes to your score. Two common ones: if your ball is lost or goes
          out of bounds, you add one penalty stroke and play again from where you last hit (stroke
          and distance). If it lands in a penalty area such as a water hazard, you generally add one
          penalty stroke and take relief. The Rules of Golf from the R&amp;A and USGA have the full
          details.
        </p>
      </section>
      <section aria-labelledby="formats">
        <h2 id="formats">Common scoring formats</h2>
        <ul>
          <li>
            <strong>Stroke play:</strong> add up every stroke over the round. The lowest total wins.
            This is the standard format and the one most casual scorecards use.
          </li>
          <li>
            <strong>Match play:</strong> you win or lose each hole against an opponent, and the
            player who wins more holes wins the match.
          </li>
          <li>
            <strong>Stableford:</strong> points are awarded per hole based on your score relative to
            par, so one bad hole will not ruin your round.
          </li>
        </ul>
      </section>
      <section aria-labelledby="easier">
        <h2 id="easier">Make scorekeeping easier</h2>
        <p>
          Use a shared digital card so everyone sees the same numbers.{' '}
          <Link href="/free-golf-scorecard">ScoreYourGame is a free golf scorecard</Link> that works
          in your browser: one person starts the round, friends join with a code, and the
          leaderboard updates after every hole.
        </p>
      </section>
    </Article>
  );
}
