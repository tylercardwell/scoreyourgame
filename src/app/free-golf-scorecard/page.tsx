import type { Metadata } from 'next';
import Link from 'next/link';
import { Article, type Faq } from '@/components/article';

const title = 'Free Golf Scorecard Online: Live Scoring for Your Group';
const description =
  'A free online golf scorecard that works in any browser. Start a round, share a code or QR, and everyone scores on one live leaderboard. No download and no account needed to join.';
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/free-golf-scorecard' },
  openGraph: { title, description, type: 'article', url: '/free-golf-scorecard' },
};

const faqs: Faq[] = [
  {
    q: 'Is ScoreYourGame really free?',
    a: 'Yes. Starting a round, inviting friends, and scoring every hole is free. There is no paywall on the scorecard.',
  },
  {
    q: 'Do my friends need to create an account?',
    a: 'No. Only the person who starts the round needs an account. Everyone else joins with the 8-digit code or QR code and picks a name for the scorecard.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. It runs in your phone or computer browser, so there is nothing to install and nothing to update.',
  },
  {
    q: 'Can I score 9 holes instead of 18?',
    a: 'Yes. Choose 9 or 18 holes when you start the round.',
  },
  {
    q: 'How do the pars get set?',
    a: 'Search for your course and the hole-by-hole pars load automatically when they are available. Course data comes from OpenStreetMap contributors via OpenGolfAPI, so it is not complete for every course. You can edit any par yourself.',
  },
  {
    q: 'Does it calculate handicaps or track GPS distances?',
    a: 'Not yet. ScoreYourGame is focused on one thing: a fast, shared stroke-play scorecard that shows gross scores against par for everyone in the group.',
  },
];

export default function Page() {
  return (
    <Article
      path="/free-golf-scorecard"
      eyebrow="Free golf scorecard"
      title="A free online golf scorecard for the whole group"
      intro="Stop passing a pencil and a crumpled card around the cart. ScoreYourGame gives your group one live scorecard that works in any browser, with standings that update as everyone scores."
      faqs={faqs}
    >
      <section aria-labelledby="how">
        <h2 id="how">How it works</h2>
        <ol>
          <li>
            <strong>Start a round.</strong> Sign in, search your course, and choose 9 or 18 holes.
            Pars load for most courses and you can change any hole.
          </li>
          <li>
            <strong>Invite your group.</strong> Share the 8-digit code or QR code. Friends join from
            their own phones with just a name, no account required.
          </li>
          <li>
            <strong>Score each hole.</strong> Everyone taps in their strokes after each hole. The
            leaderboard shows each player’s strokes, score to par, and holes played.
          </li>
          <li>
            <strong>Finish and keep it.</strong> When every hole is scored the host finishes the
            round, and signed-in players keep it in their round history.
          </li>
        </ol>
      </section>
      <section aria-labelledby="why">
        <h2 id="why">Why use an online golf scorecard</h2>
        <ul>
          <li>
            <strong>Everyone sees the same scores.</strong> No more arguing over who made what on
            the 7th. The group scorecard is the single source of truth.
          </li>
          <li>
            <strong>Nothing to download.</strong> Open the link and play. It works on iPhone,
            Android, tablets, and desktop.
          </li>
          <li>
            <strong>Great for foursomes and solo rounds.</strong> Score a casual round with friends,
            a league night, or just yourself.
          </li>
          <li>
            <strong>Live standings.</strong> Players on different holes still show up on one
            leaderboard, compared on the holes they have played.
          </li>
        </ul>
      </section>
      <section aria-labelledby="free">
        <h2 id="free">What “free” means here</h2>
        <p>
          The scorecard, invites, live leaderboard, and round history are free. There are no limits
          on how many rounds you play or how many friends join. If you are new to scoring, read our
          guide to <Link href="/how-to-keep-score-in-golf">how to keep score in golf</Link>.
        </p>
      </section>
    </Article>
  );
}
