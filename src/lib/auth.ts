import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { db } from './db';
export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
  plugins: [username({ minUsernameLength: 3, maxUsernameLength: 24 })],
  rateLimit: { enabled: true, storage: 'database', modelName: 'auth_rate_limit' },
  // Add socialProviders.google here when OAuth credentials are available.
});
