// Set NEXT_PUBLIC_SITE_URL to the production origin (no trailing slash) before deploying.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100').replace(
  /\/$/,
  '',
);
export const SITE_NAME = 'ScoreYourGame';
export const SITE_TITLE = 'Free Golf Scorecard & Live Score Tracker';
export const SITE_DESCRIPTION =
  'Free golf scoring for you and your friends. Start a round, share a code, and keep one live scorecard for the whole group. No app to download, and guests can join without an account.';
export const PAGES = [
  { path: '/', priority: 1 },
  { path: '/free-golf-scorecard', priority: 0.9 },
  { path: '/how-to-keep-score-in-golf', priority: 0.8 },
] as const;
