import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">A LITTLE OFF THE FAIRWAY</p>
      <h1>Page not found.</h1>
      <p>Head back and start a fresh round.</p>
      <Link className="button primary" href="/">
        Back to ScoreYourGame
      </Link>
    </main>
  );
}
