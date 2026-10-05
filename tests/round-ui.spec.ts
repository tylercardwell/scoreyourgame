import { test, expect, type Page } from '@playwright/test';
import type { Round } from '../src/lib/types';

const id = '11111111-1111-4111-8111-111111111111';
const fixture = (): Round => ({
  id,
  inviteCode: '12345678',
  name: 'A day on the course',
  course: 'The Falls Golf Club',
  holeCount: 18,
  status: 'active',
  revision: 1,
  createdAt: '2026-10-04T15:00:00Z',
  completedAt: null,
  holes: Array.from({ length: 18 }, (_, index) => ({ number: index + 1, par: 4 })),
  players: [{ id: 'host', nickname: 'tyler', scores: {}, isHost: true }],
  viewerId: 'host',
  isHost: true,
});

// These presentation tests intercept every API request. They never access a database.
async function openRound(page: Page, round = fixture()) {
  await page.addInitScript((initial) => {
    class FixtureEvents {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      private listener = (event: Event) => {
        this.onmessage?.(
          new MessageEvent('message', { data: JSON.stringify((event as CustomEvent).detail) }),
        );
      };
      constructor() {
        window.addEventListener('fixture-round-update', this.listener);
        setTimeout(
          () => this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(initial) })),
          100,
        );
      }
      close() {
        window.removeEventListener('fixture-round-update', this.listener);
      }
    }
    Object.defineProperty(window, 'EventSource', { value: FixtureEvents });
  }, round);
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/get-session') {
      await route.fulfill({
        json: round.isHost
          ? {
              session: {
                id: 'fixture-session',
                userId: 'host',
                token: 'fixture',
                expiresAt: '2030-01-01T00:00:00Z',
              },
              user: { id: 'host', name: 'tyler', email: 'tyler@example.com', emailVerified: false },
            }
          : null,
      });
    } else if (path.startsWith(`/api/rounds/${id}`)) {
      if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON();
        if (path.endsWith('/scores')) {
          const player = round.players.find((p) => p.id === round.viewerId)!;
          if (body.strokes === null) delete player.scores[body.hole];
          else player.scores[body.hole] = body.strokes;
        } else if (path.endsWith('/holes'))
          round.holes.find((h) => h.number === body.hole)!.par = body.par;
        round.revision++;
      }
      await route.fulfill({ json: round });
    } else await route.abort();
  });
  await page.goto(`/round/${id}`);
  await expect(page.getByRole('heading', { name: round.name, exact: true })).toBeVisible();
  await expect(page.locator('.live-status')).toContainText('Live scorecard');
  await page.evaluate(() => document.fonts.ready);
  return round;
}

test('selected desktop layout preserves scoring, invitations, par editing and live updates', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1774, height: 887 });
  const round = await openRound(page);
  await page.screenshot({ path: 'test-results/round-redesign-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Invite players', exact: true }).click();
  await expect(page.getByRole('img', { name: /QR code to join/ })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Par 4', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '5', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Par 5', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Decrease strokes' }).click();
  await page.getByRole('button', { name: /Save score/ }).click();
  await expect(page.getByRole('heading', { name: 'Hole 02 / 18' })).toBeVisible();
  await expect(page.locator('.leaderboard-row')).toContainText('4 strokes');
  await page.getByRole('tab', { name: 'Full scorecard' }).click();
  await page.getByRole('button', { name: 'Edit your score for hole 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hole 01 / 18' })).toBeVisible();
  round.players.push({ id: 'guest', nickname: 'Sam', scores: { '1': 3 }, isHost: false });
  round.revision++;
  await page.evaluate(
    (updated) => window.dispatchEvent(new CustomEvent('fixture-round-update', { detail: updated })),
    round,
  );
  await expect(page.locator('.leaderboard-row').filter({ hasText: 'Sam' })).toContainText(
    '3 strokes',
  );
});

test('phone scoring fits the viewport and all eighteen holes remain reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const round = fixture();
  round.isHost = false;
  round.viewerId = 'guest';
  round.players.push({ id: 'guest', nickname: 'Sam', scores: {}, isHost: false });
  await openRound(page, round);
  await page.screenshot({ path: 'test-results/round-redesign-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('button', { name: 'Finish round', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Par 4', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Hole 18', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hole 18 / 18' })).toBeVisible();
  await page.getByRole('button', { name: 'Increase strokes' }).click();
  await page.getByRole('button', { name: 'Save score', exact: true }).click();
  await expect(page.locator('.leaderboard-row').filter({ hasText: 'Sam' })).toContainText(
    '5 strokes',
  );
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
