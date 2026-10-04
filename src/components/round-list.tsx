'use client';
import Link from 'next/link';
import { ArrowUpRight, FlagPennant } from '@phosphor-icons/react';
import { relative, type RoundSummary } from '@/lib/types';
export function RoundList({ rounds }: { rounds: RoundSummary[] }) {
  return (
    <div className="round-list">
      {rounds.map((round) => (
        <Link href={`/round/${round.id}`} className="round-row" key={round.id}>
          <div className="round-icon">
            <FlagPennant weight="duotone" size={23} />
          </div>
          <div className="round-row-info">
            <h3>{round.name}</h3>
            <p>
              {round.course} <span>·</span> {round.holeCount} holes{' '}
              <span className="hide-mobile">
                ·{' '}
                {new Date(round.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>
          <span className={`status ${round.status}`}>
            {round.status === 'active' ? 'In progress' : 'Completed'}
          </span>
          <div className="round-score">
            <strong>{round.played ? relative(round.toPar ?? 0) : '—'}</strong>
            <span>{round.played ? `${round.strokes} strokes` : 'Not started'}</span>
          </div>
          <ArrowUpRight className="row-arrow" size={21} />
        </Link>
      ))}
    </div>
  );
}
