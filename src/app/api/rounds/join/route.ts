import { NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, ApiError, ensureGuest, handle, nickname, rateLimit, sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const data = z
      .object({ code: z.string().regex(/^\d{8}$/, 'Enter the 8-digit invitation code.'), nickname })
      .parse(await request.json());
    let who = await actor();
    who = await ensureGuest(who);
    await rateLimit(`join:${who.userId ?? who.guestHash}`, 15);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'SELECT id,status FROM rounds WHERE invite_code=$1 FOR UPDATE',
        [data.code],
      );
      const round = rows[0];
      if (!round) throw new ApiError(404, 'No round found. Double-check the invitation code.');
      const existing = await client.query(
        `SELECT id FROM participants WHERE round_id=$1 AND
        ((user_id=$2 AND $2 IS NOT NULL) OR (guest_token_hash=$3 AND $3 IS NOT NULL))`,
        [round.id, who.userId, who.guestHash],
      );
      if (!existing.rowCount) {
        if (round.status !== 'active') throw new ApiError(409, 'This round has already finished.');
        if (
          (
            await client.query(
              'SELECT 1 FROM participants WHERE round_id=$1 AND lower(nickname)=lower($2)',
              [round.id, data.nickname],
            )
          ).rowCount
        )
          throw new ApiError(409, 'That name is taken in this round. Try a different nickname.');
        await client.query(
          'INSERT INTO participants(round_id,user_id,guest_token_hash,nickname) VALUES($1,$2,$3,$4)',
          [round.id, who.userId, who.userId ? null : who.guestHash, data.nickname],
        );
        await client.query('UPDATE rounds SET revision=revision+1 WHERE id=$1', [round.id]);
        await client.query("SELECT pg_notify('round_updates',$1)", [round.id]);
      }
      await client.query('COMMIT');
      return NextResponse.json({ id: round.id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
}
