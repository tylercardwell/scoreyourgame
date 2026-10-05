import type { Metadata } from 'next';
import Link from 'next/link';
import { Article } from '@/components/article';
import { COMPANY_NAME, COMPANY_URL, SITE_NAME } from '@/lib/site';

const title = `About ${SITE_NAME}`;
const description = `${SITE_NAME} is a free golf scorecard that lets a whole group keep one live score without downloading an app. Built by ${COMPANY_NAME}.`;
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description, url: '/about' },
};

export default function Page() {
  return (
    <Article
      path="/about"
      eyebrow="About"
      title={`About ${SITE_NAME}`}
      intro="We built a golf scorecard that gets out of the way, so the group can focus on the round."
    >
      <section aria-labelledby="why">
        <h2 id="why">Why it exists</h2>
        <p>
          Most golf rounds still end with a pencil, a smudged card and an argument about the 7th
          hole. Most scoring apps ask everyone to download something and create an account first.
          {` ${SITE_NAME}`} is the opposite: one person starts a round, everyone else joins from
          their phone with a code, and the whole group sees the same live scorecard.
        </p>
      </section>
      <section aria-labelledby="what">
        <h2 id="what">What it does today</h2>
        <ul>
          <li>Free stroke-play scoring for 9 or 18 holes, for a solo round or a group.</li>
          <li>Invites by 8-digit code or QR code. Guests join with just a name.</li>
          <li>
            Course search with hole-by-hole pars where available, using OpenStreetMap data via
            OpenGolfAPI. Every par can be edited.
          </li>
          <li>A live leaderboard and round history for signed-in players.</li>
        </ul>
        <p>It does not handle handicaps or GPS distances yet. We would rather do one thing well.</p>
      </section>
      <section aria-labelledby="who">
        <h2 id="who">Who is behind it</h2>
        <p>
          {SITE_NAME} is built and run by{' '}
          <a href={COMPANY_URL} target="_blank" rel="noopener">
            {COMPANY_NAME}
          </a>
          . For feedback, bug reports or questions, get in touch through that site.
        </p>
        <p>
          Ready to play? <Link href="/">Start a free round</Link>.
        </p>
      </section>
    </Article>
  );
}
