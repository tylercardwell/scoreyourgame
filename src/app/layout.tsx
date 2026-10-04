import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
export const metadata: Metadata = {
  title: 'ScoreYourGame | A better round, together',
  description:
    'Start a golf round, invite your group, and keep a shared live scorecard. Friends can join with just a nickname.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f7f4' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
