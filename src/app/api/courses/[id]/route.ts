import { NextResponse } from 'next/server';
import { actor, ApiError, handle, rateLimit, roundId } from '@/lib/api';
import { getCourse } from '@/lib/courses';
export const runtime = 'nodejs';
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const who = await actor();
    if (!who.userId) throw new ApiError(401, 'Sign in to load course details.');
    await rateLimit(`course-detail:${who.userId}`, 30);
    const course = await getCourse(roundId.parse((await ctx.params).id));
    if (!course) throw new ApiError(404, 'We could not find that course.');
    return NextResponse.json({ course });
  });
}
