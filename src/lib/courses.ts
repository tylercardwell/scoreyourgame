import 'server-only';
import { z } from 'zod';
import { db } from './db';

const UPSTREAM = 'https://api.opengolfapi.org/v1';
const SEARCH_TTL_DAYS = 30;
// Stop calling upstream when the daily quota (500) is nearly spent.
const MIN_REMAINING = 25;
let remaining: number | null = null;

const num = z.number().nullish();
const str = z.string().nullish();
const listCourse = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  city: str,
  state: str,
  latitude: num,
  longitude: num,
  type: str,
  par: num,
  phone: str,
  website: str,
});
const detailCourse = listCourse.extend({
  holes: num,
  scorecard: z.array(z.object({ hole: z.number(), par: z.number() })).nullish(),
});
export type ListCourse = z.infer<typeof listCourse>;
export type Course = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  par: number | null;
  holeCount: number | null;
  pars: number[] | null;
};

export async function upstream(path: string): Promise<unknown | null> {
  if (remaining !== null && remaining < MIN_REMAINING) return null;
  try {
    const response = await fetch(`${UPSTREAM}${path}`, { signal: AbortSignal.timeout(10000) });
    const header = response.headers.get('x-ratelimit-remaining');
    if (header !== null) remaining = Number(header);
    if (response.status === 429) remaining = 0;
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Course API request failed:', error);
    return null;
  }
}

export async function upsertCourses(courses: ListCourse[]) {
  if (!courses.length) return;
  await db.query(
    `INSERT INTO courses(id,name,city,state,latitude,longitude,type,par,phone,website)
    SELECT * FROM unnest($1::uuid[],$2::text[],$3::text[],$4::text[],$5::float8[],$6::float8[],$7::text[],$8::int[],$9::text[],$10::text[])
    ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, state=EXCLUDED.state,
      latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, type=EXCLUDED.type, par=EXCLUDED.par,
      phone=EXCLUDED.phone, website=EXCLUDED.website, fetched_at=now()`,
    [
      courses.map((c) => c.id),
      courses.map((c) => c.name),
      courses.map((c) => c.city ?? null),
      courses.map((c) => c.state ?? null),
      courses.map((c) => c.latitude ?? null),
      courses.map((c) => c.longitude ?? null),
      courses.map((c) => c.type ?? null),
      courses.map((c) => c.par ?? null),
      courses.map((c) => c.phone ?? null),
      courses.map((c) => c.website ?? null),
    ],
  );
}

type Row = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  par: number | null;
  hole_count: number | null;
  scorecard: { hole: number; par: number }[] | null;
};
function toCourse(row: Row): Course {
  const pars = row.scorecard?.length
    ? [...row.scorecard]
        .sort((a, b) => a.hole - b.hole)
        .map((h) => Math.min(6, Math.max(3, Math.round(h.par))))
    : null;
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    par: row.par,
    holeCount: row.hole_count,
    pars,
  };
}

async function local(term: string) {
  const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await db.query<Row>(
    `SELECT id,name,city,state,par,hole_count,scorecard FROM courses
    WHERE name ILIKE $1 OR city ILIKE $1 ORDER BY (lower(name) LIKE lower($2)) DESC, name LIMIT 10`,
    [like, `${term.replace(/[\\%_]/g, '\\$&')}%`],
  );
  return rows;
}

/** Local-first search. Upstream is only called once per distinct query per 30 days. */
export async function searchCourses(raw: string): Promise<Course[]> {
  const term = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  if (term.length < 3) return [];
  const rows = await local(term);
  if (rows.length >= 10) return rows.map(toCourse);
  const { rowCount } = await db.query(
    `SELECT 1 FROM course_searches WHERE query=$1 AND fetched_at > now() - ($2 || ' days')::interval`,
    [term, SEARCH_TTL_DAYS],
  );
  if (rowCount) return rows.map(toCourse);
  const body = await upstream(`/courses/search?q=${encodeURIComponent(term)}`);
  const parsed = z.object({ courses: z.array(listCourse) }).safeParse(body);
  if (!parsed.success) return rows.map(toCourse);
  await upsertCourses(parsed.data.courses);
  await db.query(
    `INSERT INTO course_searches(query) VALUES($1) ON CONFLICT(query) DO UPDATE SET fetched_at=now()`,
    [term],
  );
  return (await local(term)).map(toCourse);
}

/** Returns the course with its per-hole scorecard, fetching upstream at most once. */
export async function getCourse(id: string): Promise<Course | null> {
  const query = () =>
    db.query<Row & { detail_fetched_at: Date | null }>(
      'SELECT id,name,city,state,par,hole_count,scorecard,detail_fetched_at FROM courses WHERE id=$1',
      [id],
    );
  let row = (await query()).rows[0];
  if (row?.detail_fetched_at) return toCourse(row);
  const parsed = detailCourse.safeParse(await upstream(`/courses/${id}`));
  if (!parsed.success) return row ? toCourse(row) : null;
  const detail = parsed.data;
  await upsertCourses([detail]);
  await db.query(
    'UPDATE courses SET hole_count=$2, scorecard=$3, detail_fetched_at=now() WHERE id=$1',
    [id, detail.holes ?? detail.scorecard?.length ?? null, JSON.stringify(detail.scorecard ?? [])],
  );
  row = (await query()).rows[0];
  return row ? toCourse(row) : null;
}
