'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <h1>Couldn’t load this page.</h1>
      <p>Please try again. Your saved scores are still in your round.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
