import 'server-only';
import { Pool } from 'pg';
const globalDb = globalThis as unknown as { golfPool?: Pool };
export const db =
  globalDb.golfPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 12,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
if (process.env.NODE_ENV !== 'production') globalDb.golfPool = db;
db.on('error', (error) => console.error('PostgreSQL connection error:', error.message));
