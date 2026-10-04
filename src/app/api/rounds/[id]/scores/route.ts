import { NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, ApiError, handle, roundId, sameOrigin } from '@/lib/api';
import { mutateRound, snapshot } from '@/lib/rounds';
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(request);
    const id = roundId.parse((await ctx.params).id);
    const who = await actor();
    const data = z
      .object({
        hole: z.number().int().min(1).max(18),
        strokes: z.number().int().min(1).max(30).nullable(),
      })
      .parse(await request.json());
    await mutateRound(id, who, async (client, member) => {
      if (
        !(
          await client.query('SELECT 1 FROM holes WHERE round_id=$1 AND number=$2', [id, data.hole])
        ).rowCount
      )
        throw new ApiError(400, 'That hole does not exist.');
      if (data.strokes === null)
        await client.query('DELETE FROM scores WHERE participant_id=$1 AND hole_number=$2', [
          member.id,
          data.hole,
        ]);
      else
        await client.query(
          `INSERT INTO scores(round_id,participant_id,hole_number,strokes) VALUES($1,$2,$3,$4)
        ON CONFLICT(participant_id,hole_number) DO UPDATE SET strokes=EXCLUDED.strokes,updated_at=now()`,
          [id, member.id, data.hole, data.strokes],
        );
    });
    return NextResponse.json(await snapshot(id, who));
  });
}
