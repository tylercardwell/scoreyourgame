import type { Metadata } from 'next';
import { Article } from '@/components/article';
import { COMPANY_NAME, COMPANY_URL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `The terms for using ${SITE_NAME}.`,
  alternates: { canonical: '/terms' },
};

export default function Page() {
  return (
    <Article
      path="/terms"
      eyebrow="Legal"
      title="Terms of use"
      intro={`Last updated October 4, 2026. By using ${SITE_NAME}, operated by ${COMPANY_NAME}, you agree to these terms.`}
    >
      <section aria-labelledby="service">
        <h2 id="service">The service</h2>
        <p>
          {SITE_NAME} is a free golf scorecard. We may change, pause or discontinue features at any
          time, and the service is provided “as is” without guarantees of availability or accuracy.
        </p>
      </section>
      <section aria-labelledby="accounts">
        <h2 id="accounts">Accounts and rounds</h2>
        <ul>
          <li>
            Keep your sign-in details secure. You are responsible for activity on your account.
          </li>
          <li>Use names and content that are appropriate for other players to see.</li>
          <li>The round host controls pars and finishing the round.</li>
        </ul>
      </section>
      <section aria-labelledby="acceptable">
        <h2 id="acceptable">Acceptable use</h2>
        <p>
          Do not attempt to disrupt the service, scrape it at scale, bypass rate limits, access
          other people’s rounds without an invite, or use it for anything unlawful.
        </p>
      </section>
      <section aria-labelledby="data">
        <h2 id="data">Course data</h2>
        <p>
          Course information comes from OpenStreetMap contributors via OpenGolfAPI under the Open
          Database License. It may be incomplete or wrong, so check pars on the scorecard at the
          course.
        </p>
      </section>
      <section aria-labelledby="liability">
        <h2 id="liability">Liability</h2>
        <p>
          To the extent allowed by law, {COMPANY_NAME} is not liable for lost data, incorrect
          scores, or any indirect damages from using the service. Scores are for fun and are not an
          official handicap record.
        </p>
      </section>
      <section aria-labelledby="contact">
        <h2 id="contact">Contact</h2>
        <p>
          Questions about these terms? Reach us through{' '}
          <a href={COMPANY_URL} target="_blank" rel="noopener">
            {COMPANY_NAME}
          </a>
          .
        </p>
      </section>
    </Article>
  );
}
