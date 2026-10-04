import { NextResponse } from 'next/server';
import { actor, ApiError, handle, rateLimit } from '@/lib/api';
import { searchCourses } from '@/lib/courses';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return handle(async () => {
    const who = await actor();
    if (!who.userId) throw new ApiError(401, 'Sign in to search courses.');
    await rateLimit(`course-search:${who.userId}`, 30);
    const q = new URL(request.url).searchParams.get('q') ?? '';
    return NextResponse.json({ courses: await searchCourses(q.slice(0, 80)) });
  });
}
