import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { actor, ApiError, handle, sameOrigin, rateLimit, nickname } from '@/lib/api';
import { db } from '@/lib/db';
import { history } from '@/lib/rounds';
export const runtime = 'nodejs';
export async function GET() {
  return handle(async () => NextResponse.json(await history(await actor())));
}
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  course: z.string().trim().min(2).max(100),
  nickname,
  holeCount: z.union([z.literal(9), z.literal(18)]),
  pars: z.array(z.number().int().min(3).max(6)).optional(),
});
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const who = await actor();
    if (!who.userId)
      throw new ApiError(401, 'Sign in to start a round. Friends can join without an account.');
    await rateLimit(`create:${who.userId}`, 10);
    const data = schema.parse(await request.json());
    if (data.pars && data.pars.length !== data.holeCount)
      throw new ApiError(400, 'Set a par for every hole.');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      let round: { id: string } | undefined;
      for (let attempt = 0; attempt < 5 && !round; attempt++) {
        const result = await client.query(
          `INSERT INTO rounds(invite_code,name,course,hole_count,host_user_id)
          VALUES($1,$2,$3,$4,$5) ON CONFLICT(invite_code) DO NOTHING RETURNING id`,
          [
            String(randomInt(10000000, 100000000)),
            data.name,
            data.course,
            data.holeCount,
            who.userId,
          ],
        );
        round = result.rows[0];
      }
      if (!round) throw new ApiError(503, 'Please try starting the round again.');
      for (let hole = 1; hole <= data.holeCount; hole++)
        await client.query('INSERT INTO holes(round_id,number,par) VALUES($1,$2,$3)', [
          round.id,
          hole,
          data.pars?.[hole - 1] ?? 4,
        ]);
      await client.query('INSERT INTO participants(round_id,user_id,nickname) VALUES($1,$2,$3)', [
        round.id,
        who.userId,
        data.nickname,
      ]);
      await client.query('COMMIT');
      return NextResponse.json({ id: round.id }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
}
