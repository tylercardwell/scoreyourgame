import { NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, ApiError, handle, roundId, sameOrigin } from '@/lib/api';
import { mutateRound, snapshot } from '@/lib/rounds';
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(request);
    const id = roundId.parse((await ctx.params).id),
      who = await actor();
    const data = z
      .object({ hole: z.number().int().min(1).max(18), par: z.number().int().min(3).max(6) })
      .parse(await request.json());
    await mutateRound(id, who, async (client, member) => {
      if (!member.isHost) throw new ApiError(403, 'Only the host can set hole pars.');
      const result = await client.query('UPDATE holes SET par=$3 WHERE round_id=$1 AND number=$2', [
        id,
        data.hole,
        data.par,
      ]);
      if (!result.rowCount) throw new ApiError(400, 'That hole does not exist.');
    });
    return NextResponse.json(await snapshot(id, who));
  });
}
