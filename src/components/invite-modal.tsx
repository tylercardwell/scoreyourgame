'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { Copy, Check, ShareNetwork } from '@phosphor-icons/react';
import { Modal, ErrorMessage } from './ui';
export function InviteModal({ code, close }: { code: string; close: () => void }) {
  const [qr, setQr] = useState(''),
    [copied, setCopied] = useState(''),
    [error, setError] = useState('');
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/join?code=${code}`;
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#20392d', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(setQr)
      .catch(() => setError('Unable to generate the QR code. Share the invitation code instead.'));
  }, [url]);
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 2500);
    } catch {
      setError('Copy isn’t available in this browser. Select the code or link to copy it.');
    }
  }
  return (
    <Modal title="Golf is better together." close={close}>
      <p className="modal-intro">Scan to join. Your friends only need a nickname.</p>
      <div className="qr-container">
        {qr ? (
          <Image
            src={qr}
            unoptimized
            width={240}
            height={240}
            alt={`QR code to join this round with code ${code}`}
          />
        ) : (
          <div className="qr-loading">Preparing your QR code…</div>
        )}
      </div>
      <span className="invite-label">OR ENTER THE INVITATION CODE</span>
      <button
        className="invite-code"
        onClick={() => copy(code, 'code')}
        aria-label={`Copy invitation code ${code}`}
      >
        <span>
          {code.slice(0, 4)} {code.slice(4)}
        </span>
        {copied === 'code' ? <Check size={22} /> : <Copy size={22} />}
      </button>
      <div className="invite-actions">
        <button
          className="button primary"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: 'Join my golf round',
                  text: `Join my round on ScoreYourGame. Invite code: ${code}`,
                  url,
                });
              } catch (e) {
                if (e instanceof Error && e.name !== 'AbortError')
                  setError('Unable to share. Copy the link instead.');
              }
            } else await copy(url, 'link');
          }}
        >
          <ShareNetwork size={19} />
          Share invite
        </button>
        <button className="button secondary" onClick={() => copy(url, 'link')}>
          {copied === 'link' ? <Check size={19} /> : <Copy size={19} />}{' '}
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <input
        className="share-url"
        aria-label="Invitation link"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
      />
      <ErrorMessage message={error} />
    </Modal>
  );
}
