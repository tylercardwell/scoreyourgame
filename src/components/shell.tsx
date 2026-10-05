'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Brand, Modal, ErrorMessage } from './ui';
import { AuthModal } from './auth-modal';
import { ArrowRight, SignOut, CaretDown } from '@phosphor-icons/react';
export function Shell({
  children,
  active = 'play',
  compact = false,
  variant = 'default',
}: {
  children: React.ReactNode;
  active?: 'play' | 'rounds';
  compact?: boolean;
  variant?: 'default' | 'round';
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false),
    [help, setHelp] = useState(false),
    [menu, setMenu] = useState(false),
    [error, setError] = useState('');
  return (
    <div className={`app-shell ${variant === 'round' ? 'round-shell' : ''}`}>
      {variant !== 'round' && (
        <div className="util-bar">
          <span>Live scoring for every group</span>
          <span>Everyone plays. Everyone scores.</span>
        </div>
      )}
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          {!compact && (
            <nav className="main-nav" aria-label="Main navigation">
              <Link className={active === 'play' ? 'nav-active' : ''} href="/">
                Play
              </Link>
              <Link className={active === 'rounds' ? 'nav-active' : ''} href="/rounds">
                My rounds
              </Link>
              {variant !== 'round' && <button onClick={() => setHelp(true)}>How it works</button>}
            </nav>
          )}
          <div className="header-account">
            {isPending ? (
              <span className="account-loading" />
            ) : session ? (
              <div className="account-wrap">
                <button
                  className="account-button"
                  aria-expanded={menu}
                  onClick={() => setMenu(!menu)}
                >
                  <span className="avatar small">
                    {session.user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="account-name">{session.user.name}</span>
                  <CaretDown size={13} />
                </button>
                {menu && (
                  <div className="account-menu">
                    <span>{session.user.email}</span>
                    <button
                      onClick={async () => {
                        const result = await authClient.signOut();
                        if (result.error) setError('Unable to sign out. Try again.');
                        else {
                          setMenu(false);
                          router.push('/');
                          router.refresh();
                        }
                      }}
                    >
                      <SignOut size={18} />
                      Sign out
                    </button>
                    <ErrorMessage message={error} />
                  </div>
                )}
              </div>
            ) : (
              <button className="button header-signin" onClick={() => setAuthOpen(true)}>
                Sign in <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <span>
          {variant === 'round' ? 'Scores save when you tap Save.' : 'A better round, together.'}
        </span>
        <nav className="footer-links" aria-label="Guides">
          <Link href="/free-golf-scorecard">Free golf scorecard</Link>
          <Link href="/how-to-keep-score-in-golf">How to keep score in golf</Link>
        </nav>
        <span>
          {variant === 'round' && (
            <>
              A better round, together. <span className="footer-dot">·</span>{' '}
            </>
          )}
          ScoreYourGame <span className="footer-dot">·</span> Built by{' '}
          <a href="https://cardwellweb.com" target="_blank" rel="noopener">
            Cardwell Web
          </a>
        </span>
      </footer>
      {authOpen && <AuthModal close={() => setAuthOpen(false)} done={() => setAuthOpen(false)} />}
      {help && (
        <Modal title="From the tee to the last putt." close={() => setHelp(false)}>
          <div className="help-steps">
            <section>
              <span>1</span>
              <div>
                <h3>Start your round</h3>
                <p>
                  Sign in, choose 9 or 18 holes, and add your course. Playing solo works just as
                  well.
                </p>
              </div>
            </section>
            <section>
              <span>2</span>
              <div>
                <h3>Bring your group</h3>
                <p>
                  Share the QR code or 8-digit invite. Friends can sign in or join with just a
                  nickname.
                </p>
              </div>
            </section>
            <section>
              <span>3</span>
              <div>
                <h3>Play. Tap. Repeat.</h3>
                <p>
                  Enter your strokes after each hole. Scores appear on everyone’s live scorecard.
                </p>
              </div>
            </section>
          </div>
          <button className="button primary full" onClick={() => setHelp(false)}>
            Got it <ArrowRight size={18} />
          </button>
        </Modal>
      )}
    </div>
  );
}
