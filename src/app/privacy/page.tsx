import type { Metadata } from 'next';
import { Article } from '@/components/article';
import { COMPANY_NAME, COMPANY_URL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses and protects your information.`,
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return (
    <Article
      path="/privacy"
      eyebrow="Legal"
      title="Privacy policy"
      intro={`Last updated October 4, 2026. This explains what ${SITE_NAME}, operated by ${COMPANY_NAME}, collects and how it is used.`}
    >
      <section aria-labelledby="collect">
        <h2 id="collect">What we collect</h2>
        <ul>
          <li>
            <strong>Account details</strong> if you sign up: your name, username, email address and
            a hashed password. We never store your password in plain text.
          </li>
          <li>
            <strong>Round data:</strong> round names, courses, hole pars, player names or nicknames,
            and the scores entered.
          </li>
          <li>
            <strong>Sign-in and security data:</strong> session records, which can include your IP
            address and browser details, and IP-based counters we use to rate-limit sign-ups and
            sign-ins.
          </li>
          <li>
            <strong>Guest identifiers:</strong> if you join a round without an account, we store a
            random token in a cookie and keep only a hash of it, so you can return to the same
            scorecard.
          </li>
        </ul>
      </section>
      <section aria-labelledby="use">
        <h2 id="use">How we use it</h2>
        <p>
          To run the scorecard: sign you in, show your group the live leaderboard, keep your round
          history, and protect the service from abuse. We do not sell your data and we do not show
          ads.
        </p>
      </section>
      <section aria-labelledby="cookies">
        <h2 id="cookies">Cookies</h2>
        <p>
          We use essential cookies only: a sign-in session cookie and a guest cookie that lasts up
          to 90 days. They are required for the service to work. We do not currently use advertising
          or analytics cookies. If that changes we will update this page.
        </p>
      </section>
      <section aria-labelledby="third">
        <h2 id="third">Third parties</h2>
        <ul>
          <li>
            <strong>Course data:</strong> when you search for a course, our server queries
            OpenGolfAPI (OpenStreetMap contributors). Only the search text is sent, not your
            identity, and results are cached.
          </li>
          <li>
            <strong>Hosting and database:</strong> your data is stored with our infrastructure
            providers so the service can run.
          </li>
        </ul>
      </section>
      <section aria-labelledby="share">
        <h2 id="share">What other players can see</h2>
        <p>
          People in your round can see the round name, course, and the names and scores of everyone
          in it. Share an invite code only with people you want in the round.
        </p>
      </section>
      <section aria-labelledby="choices">
        <h2 id="choices">Your choices</h2>
        <p>
          You can ask us to access, correct or delete your account and round data at any time.
          Contact us through{' '}
          <a href={COMPANY_URL} target="_blank" rel="noopener">
            {COMPANY_NAME}
          </a>
          .
        </p>
      </section>
    </Article>
  );
}
