import { Shell } from '@/components/shell';
import { JoinForm } from '@/components/join-form';
import { QrCode } from '@phosphor-icons/react/dist/ssr';
export default async function Join({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  return (
    <Shell compact>
      <main className="join-page">
        <span className="join-icon">
          <QrCode size={32} />
        </span>
        <p className="eyebrow">BETTER WITH YOUR GROUP</p>
        <h1>You’re invited.</h1>
        <p className="page-intro">A name, a code, and you’re on the scorecard.</p>
        <div className="join-panel">
          <JoinForm
            initialCode={
              typeof params.code === 'string' ? params.code.replace(/\D/g, '').slice(0, 8) : ''
            }
          />
        </div>
        <p className="guest-footnote">
          Joining as a guest? Use this same browser to return to your round. Your place is saved for
          90 days.
        </p>
      </main>
    </Shell>
  );
}
