import Link from 'next/link';
import { GUIDES } from '@/lib/site';
import { Shell } from './shell';

export type Faq = { q: string; a: string };

export function Article({
  eyebrow,
  title,
  intro,
  children,
  faqs,
  path,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  faqs?: Faq[];
  path: string;
}) {
  return (
    <Shell compact>
      <main className="article">
        <p className="article-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="article-intro">{intro}</p>
        <div className="article-cta">
          <Link className="tour-btn tour-btn-solid" href="/">
            Start a free round
          </Link>
          <Link className="tour-btn tour-btn-outline" href="/join">
            Join with a code
          </Link>
        </div>
        {children}
        {faqs && (
          <section aria-labelledby="faq">
            <h2 id="faq">Frequently asked questions</h2>
            {faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </section>
        )}
        <nav className="article-more" aria-label="More from ScoreYourGame">
          {GUIDES.filter((guide) => guide.path !== path).map((guide) => (
            <Link key={guide.path} href={guide.path}>
              {guide.label}
            </Link>
          ))}
          <Link href="/">Start a round</Link>
        </nav>
      </main>
    </Shell>
  );
}
