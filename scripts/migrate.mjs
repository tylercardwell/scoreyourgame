import { Pool } from 'pg';
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { getMigrations } from 'better-auth/db/migration';
import { readFile, readdir } from 'node:fs/promises';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local first.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    plugins: [username()],
    rateLimit: { enabled: true, storage: 'database', modelName: 'auth_rate_limit' },
  });
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dir = new URL('../db/', import.meta.url);
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort())
      await client.query(await readFile(new URL(file, dir), 'utf8'));
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  console.log('Better Auth and golf tables are ready.');
} finally {
  await pool.end();
}
