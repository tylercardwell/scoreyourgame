import type { Metadata } from 'next';
import { Home } from '@/components/home';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
export const metadata: Metadata = { alternates: { canonical: '/' } };
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Home />
    </>
  );
}
