// Set NEXT_PUBLIC_SITE_URL to the production origin (no trailing slash) before deploying.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100').replace(
  /\/$/,
  '',
);
export const SITE_NAME = 'ScoreYourGame';
export const SITE_TITLE = 'Free Golf Scorecard & Live Score Tracker';
export const SITE_DESCRIPTION =
  'Free golf scoring for you and your friends. Start a round, share a code, and keep one live scorecard for the whole group. No app to download, and guests can join without an account.';
export const GUIDES = [
  { path: '/free-golf-scorecard', label: 'Free golf scorecard' },
  { path: '/printable-golf-scorecard', label: 'Printable golf scorecard' },
  { path: '/how-to-keep-score-in-golf', label: 'How to keep score in golf' },
] as const;
export const COMPANY = [
  { path: '/about', label: 'About' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/terms', label: 'Terms' },
] as const;
export const PAGES = [
  { path: '/', priority: 1 },
  ...GUIDES.map(({ path }) => ({ path, priority: 0.9 })),
  ...COMPANY.map(({ path }) => ({ path, priority: 0.3 })),
];
export const COMPANY_NAME = 'Cardwell Web';
export const COMPANY_URL = 'https://cardwellweb.com';
