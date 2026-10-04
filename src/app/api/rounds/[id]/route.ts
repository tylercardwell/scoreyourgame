import { NextResponse } from 'next/server';
import { actor, ApiError, handle, roundId, sameOrigin } from '@/lib/api';
import { mutateRound, snapshot } from '@/lib/rounds';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, ctx: Context) {
  return handle(async () =>
    NextResponse.json(await snapshot(roundId.parse((await ctx.params).id), await actor()), {
      headers: { 'Cache-Control': 'no-store' },
    }),
  );
}
export async function PATCH(request: Request, ctx: Context) {
  return handle(async () => {
    sameOrigin(request);
    const id = roundId.parse((await ctx.params).id);
    const who = await actor();
    await mutateRound(id, who, async (client, member) => {
      if (!member.isHost) throw new ApiError(403, 'Only the host can finish the round.');
      const { rows } = await client.query(
        `SELECT count(*)::int AS missing FROM participants p CROSS JOIN holes h
        LEFT JOIN scores s ON s.participant_id=p.id AND s.hole_number=h.number
        WHERE p.round_id=$1 AND h.round_id=$1 AND s.strokes IS NULL`,
        [id],
      );
      if (rows[0].missing > 0)
        throw new ApiError(
          409,
          `There are ${rows[0].missing} scores still to enter. Finish everyone's scorecard first.`,
        );
      await client.query("UPDATE rounds SET status='completed',completed_at=now() WHERE id=$1", [
        id,
      ]);
    });
    return NextResponse.json(await snapshot(id, who));
  });
}
