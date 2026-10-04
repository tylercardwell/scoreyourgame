// Bulk-cache courses by state: npm run courses:import -- CA TX   (or: -- --all)
// Costs ~1 request per 500 courses; the upstream quota is 500 requests/day.
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local first.');
const STATES =
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(
    ' ',
  );
const args = process.argv.slice(2).map((a) => a.toUpperCase());
const states = args.includes('--ALL') ? STATES : args.filter((a) => /^[A-Z]{2}$/.test(a));
if (!states.length) {
  console.error('Usage: npm run courses:import -- CA TX   (or -- --all)');
  process.exit(1);
}
const PAGE = 500;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let remaining = Infinity;
try {
  outer: for (const state of states) {
    let offset = 0,
      total = Infinity,
      saved = 0;
    while (offset < total) {
      if (remaining < 20) {
        console.log(`Stopping: only ${remaining} upstream requests left today.`);
        break outer;
      }
      const response = await fetch(
        `https://api.opengolfapi.org/v1/courses/state/${state}?limit=${PAGE}&offset=${offset}`,
      );
      remaining = Number(response.headers.get('x-ratelimit-remaining') ?? remaining);
      if (!response.ok) {
        console.error(`${state}: upstream returned ${response.status}; skipping.`);
        break;
      }
      const body = await response.json();
      const rows = (body.courses ?? []).filter((c) => c.id && c.name);
      total = Number(body.total ?? 0);
      if (!rows.length) break;
      const col = (key) => rows.map((c) => c[key] ?? null);
      await pool.query(
        `INSERT INTO courses(id,name,city,state,latitude,longitude,type,par,phone,website)
        SELECT * FROM unnest($1::uuid[],$2::text[],$3::text[],$4::text[],$5::float8[],$6::float8[],$7::text[],$8::int[],$9::text[],$10::text[])
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, state=EXCLUDED.state,
          latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, type=EXCLUDED.type, par=EXCLUDED.par,
          phone=EXCLUDED.phone, website=EXCLUDED.website, fetched_at=now()`,
        [
          'id',
          'name',
          'city',
          'state',
          'latitude',
          'longitude',
          'type',
          'par',
          'phone',
          'website',
        ].map(col),
      );
      saved += rows.length;
      offset += rows.length;
    }
    console.log(`${state}: cached ${saved} courses (${remaining} requests left today).`);
  }
} finally {
  await pool.end();
}
