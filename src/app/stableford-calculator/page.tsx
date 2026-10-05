import type { Metadata } from 'next';
import Link from 'next/link';
import { Article, type Faq } from '@/components/article';
import { StablefordCalculator } from '@/components/stableford-calculator';

const title = 'Stableford Calculator: Free Online Stableford Points Calculator';
const description =
  'Free Stableford calculator. Enter your handicap, pars, stroke indexes and scores to get net Stableford points for 9 or 18 holes, with a clear explanation of how the scoring works.';
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/stableford-calculator' },
  openGraph: { title, description, type: 'article', url: '/stableford-calculator' },
};

const points = [
  ['Net double bogey or worse', '0'],
  ['Net bogey', '1'],
  ['Net par', '2'],
  ['Net birdie', '3'],
  ['Net eagle', '4'],
  ['Net albatross', '5'],
];

const faqs: Faq[] = [
  {
    q: 'How do you calculate Stableford points?',
    a: 'For each hole, subtract the strokes you receive from your gross score to get your net score. Points are 2 plus the hole’s par minus your net score, and never less than 0. Add up the points for every hole.',
  },
  {
    q: 'What is a good Stableford score?',
    a: 'Over 18 holes, 36 points means you played exactly to your handicap. Scores above 36 beat your handicap, and many club competitions are won with roughly 38 to 42 points.',
  },
  {
    q: 'What if I pick up my ball?',
    a: 'If you cannot score on a hole, pick up. You earn 0 points for it and can carry on, which is the main appeal of Stableford. Leave that hole’s score blank in the calculator.',
  },
  {
    q: 'What is the stroke index?',
    a: 'Each hole has a stroke index from 1 to 18 (1 to 9 on a nine-hole course) printed on the scorecard. It ranks the holes from hardest to easiest and decides where handicap strokes are given. Lower numbers get strokes first.',
  },
  {
    q: 'Which handicap should I use?',
    a: 'Use your playing handicap for the tees you play, which is your course handicap adjusted by the competition allowance (often 95% for individual events). If you are not sure, enter your course handicap, or use 0 for gross Stableford with no strokes given.',
  },
  {
    q: 'Does this calculator work for 9 holes?',
    a: 'Yes. Switch to 9 holes, enter your playing handicap for nine holes, and use stroke indexes 1 to 9. Playing to handicap over nine holes is 18 points.',
  },
];

export default function Page() {
  return (
    <Article
      path="/stableford-calculator"
      eyebrow="Free golf calculator"
      title="Stableford calculator"
      intro="Enter your handicap and your hole-by-hole scores to get your net Stableford points. It works for 9 or 18 holes and shows every step."
      faqs={faqs}
    >
      <section aria-labelledby="calc">
        <h2 id="calc">Calculate your Stableford points</h2>
        <p>
          Set each hole’s par and stroke index from your scorecard, then type your gross score for
          each hole. Leave a hole blank if you picked up.
        </p>
        <StablefordCalculator />
      </section>
      <section aria-labelledby="how">
        <h2 id="how">How Stableford scoring works</h2>
        <p>
          Stableford rewards good holes and softens bad ones: you earn points on every hole based on
          your <em>net</em> score, which is your strokes minus the handicap strokes you receive on
          that hole.
        </p>
        <table>
          <thead>
            <tr>
              <th>Net score on the hole</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {points.map(([name, value]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section aria-labelledby="example">
        <h2 id="example">Worked example</h2>
        <p>
          You have a playing handicap of 20 on an 18-hole course. That gives you 1 stroke on every
          hole plus a second stroke on the two hardest holes (stroke index 1 and 2). On a par 4 with
          stroke index 12 you take 5 strokes. You receive 1 stroke, so your net score is 4, a net
          par, which earns 2 points. On a par 4 with stroke index 1 you take 6 strokes. You receive
          2 strokes, so your net score is 4 and you again score 2 points.
        </p>
      </section>
      <section aria-labelledby="keep">
        <h2 id="keep">Keep score as you play</h2>
        <p>
          Want your group’s scores tracked live instead of added up afterwards?{' '}
          <Link href="/free-golf-scorecard">ScoreYourGame is a free golf scorecard</Link> that shows
          one shared leaderboard for everyone. You can also read{' '}
          <Link href="/how-to-keep-score-in-golf">how to keep score in golf</Link> or print a{' '}
          <Link href="/printable-golf-scorecard">free scorecard</Link>.
        </p>
      </section>
    </Article>
  );
}
