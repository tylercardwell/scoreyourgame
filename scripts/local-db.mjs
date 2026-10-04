// Optional Windows helper. Creates a separate, password-protected development cluster.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
const root = resolve('.');
const folder = join(root, '.local-postgres');
const data = join(folder, 'data');
const bin = process.env.PG_BIN || 'C:/Program Files/PostgreSQL/17/bin';
const port = 55432;
function run(tool, args) {
  const result = spawnSync(join(bin, tool + (process.platform === 'win32' ? '.exe' : '')), args, {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || String(result.error));
  return result.stdout;
}
await mkdir(folder, { recursive: true });
if (!existsSync(data)) {
  if (existsSync('.env.local'))
    throw new Error(
      'An .env.local already exists. Use your configured database, or move it aside before provisioning a new local cluster.',
    );
  const password = randomBytes(24).toString('hex');
  const pwfile = join(folder, 'initial-password');
  await writeFile(pwfile, password);
  try {
    run('initdb', [
      '-D',
      data,
      '-U',
      'scoreyourgame',
      '-A',
      'scram-sha-256',
      '--pwfile',
      pwfile,
      '--encoding=UTF8',
      '--locale=C',
    ]);
  } finally {
    await unlink(pwfile);
  }
  await writeFile(
    '.env.local',
    `DATABASE_URL=postgresql://scoreyourgame:${password}@127.0.0.1:${port}/scoreyourgame\nBETTER_AUTH_SECRET=${randomBytes(48).toString('base64url')}\nBETTER_AUTH_URL=http://localhost:3100\n`,
  );
}
const status = spawnSync(
  join(bin, 'pg_ctl' + (process.platform === 'win32' ? '.exe' : '')),
  ['-D', data, 'status'],
  { windowsHide: true },
);
if (status.status !== 0)
  run('pg_ctl', [
    '-D',
    data,
    '-l',
    join(folder, 'postgres.log'),
    '-o',
    `-p ${port} -h 127.0.0.1`,
    '-w',
    'start',
  ]);
const env = await readFile('.env.local', 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1];
if (!url) throw new Error('Missing DATABASE_URL.');
const admin = new Pool({ connectionString: url.replace(/\/scoreyourgame$/, '/postgres') });
try {
  if (!(await admin.query("SELECT 1 FROM pg_database WHERE datname = 'scoreyourgame'")).rowCount)
    await admin.query('CREATE DATABASE scoreyourgame');
} finally {
  await admin.end();
}
console.log(`Local PostgreSQL is ready at 127.0.0.1:${port}. Run npm run db:migrate next.`);
