'use client';
import { useEffect, useRef } from 'react';
import { FlagPennant, X, ArrowUpRight, SpinnerGap } from '@phosphor-icons/react';
import Link from 'next/link';
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="ScoreYourGame home">
      <span className="brand-symbol">
        <FlagPennant weight="fill" size={23} />
      </span>
      <span>
        score<span className="brand-soft">your</span>game<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Busy({ text = 'Please wait' }: { text?: string }) {
  return (
    <span className="button-content">
      <SpinnerGap className="spin" size={19} />
      {text}
    </span>
  );
}
export function Arrow() {
  return <ArrowUpRight size={21} />;
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error-message">
      {message}
    </p>
  ) : null;
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result as T;
}
