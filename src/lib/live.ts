import { Client } from 'pg';
import { EventEmitter } from 'node:events';
// A dedicated listener per Node process. PostgreSQL notifications reach every app instance.
const globalLive = globalThis as unknown as {
  golfLive?: { events: EventEmitter; ready: Promise<void> | null };
};
const live = globalLive.golfLive ?? { events: new EventEmitter(), ready: null };
globalLive.golfLive = live;
live.events.setMaxListeners(0);
export async function listen() {
  if (!live.ready) live.ready = connect();
  await live.ready;
  return live.events;
}
async function connect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
  });
  client.on('notification', (message) => {
    if (message.payload) live.events.emit(message.payload);
  });
  client.on('error', () => {
    live.ready = null;
    void client.end().catch(() => {});
  });
  client.on('end', () => {
    live.ready = null;
  });
  try {
    await client.connect();
    await client.query('LISTEN round_updates');
  } catch (error) {
    live.ready = null;
    await client.end().catch(() => {});
    throw error;
  }
}
