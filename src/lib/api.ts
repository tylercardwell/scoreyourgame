import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from './auth';
import { db } from './db';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function handle(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Please check your input.' },
        { status: 400 },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    console.error('API request failed:', error);
    return NextResponse.json(
      { error: 'Unable to save right now. Please try again.' },
      { status: 503 },
    );
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = process.env.BETTER_AUTH_URL || new URL(request.url).origin;
  if (!origin || new URL(origin).origin !== new URL(allowed).origin)
    throw new ApiError(403, 'Please open this request from ScoreYourGame.');
}
export type Actor = { userId: string | null; name: string | null; guestHash: string | null };
export async function actor(): Promise<Actor> {
  const session = await auth.api.getSession({ headers: await headers() });
  const token = (await cookies()).get('syg_guest')?.value;
  return {
    userId: session?.user.id ?? null,
    name: session?.user.name ?? null,
    guestHash: token ? createHash('sha256').update(token).digest('hex') : null,
  };
}
export async function ensureGuest(who: Actor) {
  if (who.guestHash) return who;
  const token = randomBytes(32).toString('base64url');
  (await cookies()).set('syg_guest', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return { ...who, guestHash: createHash('sha256').update(token).digest('hex') };
}
export async function rateLimit(key: string, max = 30) {
  const { rows } = await db.query(
    `INSERT INTO rate_limits(key, hits, expires_at) VALUES ($1, 1, now() + interval '1 minute')
    ON CONFLICT (key) DO UPDATE SET hits = CASE WHEN rate_limits.expires_at < now() THEN 1 ELSE rate_limits.hits + 1 END,
    expires_at = CASE WHEN rate_limits.expires_at < now() THEN now() + interval '1 minute' ELSE rate_limits.expires_at END RETURNING hits`,
    [key],
  );
  if (rows[0].hits > max)
    throw new ApiError(429, 'A few too many attempts. Try again in a minute.');
}
export const roundId = z.uuid();
export const nickname = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters for your name.')
  .max(30, 'Names can be up to 30 characters.');
