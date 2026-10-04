import { test, expect, type BrowserContext } from '@playwright/test';
const origin = process.env.TEST_BASE_URL || 'http://localhost:3100';
async function request(context: BrowserContext, path: string, method: string, data?: unknown) {
  return context.request.fetch(path, { method, data, headers: { Origin: origin } });
}
// Real authentication stays rate-limited. Local browsers share a single client IP.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 11000));
});
test('a host and an account-free guest share a real live round', async ({ browser }) => {
  const suffix = Date.now().toString();
  const hostContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const guestContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const outsider = await browser.newContext();
  const host = await hostContext.newPage(),
    guest = await guestContext.newPage();
  try {
    await host.goto('/');
    await expect(
      host.getByRole('heading', { name: 'Less scorekeeping. More golf.' }),
    ).toBeVisible();
    await host.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
    await host.getByRole('button', { name: /Start a round/ }).click();
    await host.getByLabel('Your name', { exact: true }).fill('Alex Morgan');
    await host.getByLabel('Username', { exact: true }).fill(`alex${suffix}`);
    await host.getByLabel('Email', { exact: true }).fill(`alex${suffix}@example.com`);
    await host.getByLabel('Password', { exact: true }).fill('Fairway-pass-2026!');
    await host.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(host.getByRole('heading', { name: 'A fresh scorecard.' })).toBeVisible();
    await host.getByLabel('Round name').fill('Sunday at the links');
    await host.getByLabel('Course', { exact: true }).fill('Prairie Links Golf Club');
    await host.getByRole('button', { name: /9 holes/ }).click();
    await host.getByRole('button', { name: 'Start round', exact: true }).click();
    await expect(host).toHaveURL(/\/round\/[0-9a-f-]+$/);
    const id = host.url().split('/').pop()!;
    await expect(host.getByRole('heading', { name: 'Sunday at the links' })).toBeVisible();
    const hostRound = await (await hostContext.request.get(`/api/rounds/${id}`)).json();
    const code = hostRound.inviteCode;
    expect((await outsider.request.get(`/api/rounds/${id}`)).status()).toBe(403);
    expect((await outsider.request.get(`/api/rounds/${id}/events`)).status()).toBe(403);
    await host.getByRole('button', { name: 'Invite players' }).click();
    await expect(host.getByRole('img', { name: /QR code to join/ })).toBeVisible();
    await host.screenshot({ path: 'test-results/invitation-desktop.png' });
    await host.getByRole('button', { name: 'Close dialog' }).click();
    await guest.goto(`/join?code=${code}`);
    await guest.getByLabel('Your nickname').fill('Sam');
    await guest.screenshot({ path: 'test-results/join-mobile.png', fullPage: true });
    await guest.getByRole('button', { name: 'Join round', exact: true }).click();
    await expect(guest).toHaveURL(new RegExp(`/round/${id}$`));
    await expect(host.locator('.leaderboard-name').filter({ hasText: 'Sam' })).toBeVisible({
      timeout: 5000,
    });
    await guest.getByRole('button', { name: 'Decrease strokes' }).click();
    await guest.getByRole('button', { name: /Save score/ }).click();
    await expect(guest.getByRole('heading', { name: 'Hole 02 / 9' })).toBeVisible();
    await expect(host.locator('.leaderboard-row').filter({ hasText: 'Sam' })).toContainText(
      '3 strokes · 1 hole',
      { timeout: 5000 },
    );
    await host.getByRole('button', { name: 'Increase strokes' }).click();
    await host.getByRole('button', { name: /Save score/ }).click();
    await expect(
      guest.locator('.leaderboard-row').filter({ hasText: 'Alex Morgan' }),
    ).toContainText('5 strokes · 1 hole', { timeout: 5000 });
    await expect(guest.locator('.live-status')).toContainText('Live scorecard');
    await guest.screenshot({ path: 'test-results/scorecard-mobile.png', fullPage: true });
    await host.screenshot({ path: 'test-results/scorecard-desktop.png', fullPage: true });
    expect(
      await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await guest.reload();
    await expect(guest.getByRole('heading', { name: 'Hole 02 / 9' })).toBeVisible();
    expect((await request(guestContext, `/api/rounds/${id}`, 'PATCH', {})).status()).toBe(403);
    expect(
      (await request(guestContext, `/api/rounds/${id}/holes`, 'PUT', { hole: 1, par: 5 })).status(),
    ).toBe(403);
    expect((await request(hostContext, `/api/rounds/${id}`, 'PATCH', {})).status()).toBe(409);
    expect(
      (
        await request(guestContext, `/api/rounds/${id}/scores`, 'PUT', { hole: 10, strokes: 4 })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request(guestContext, `/api/rounds/${id}/scores`, 'PUT', { hole: 1, strokes: 0 })
      ).status(),
    ).toBe(400);
    expect(
      (await request(outsider, '/api/rounds/join', 'POST', { code, nickname: 'Sam' })).status(),
    ).toBe(409);
    expect(
      (
        await hostContext.request.put(`/api/rounds/${id}/scores`, {
          data: { hole: 1, strokes: 4 },
          headers: { Origin: 'https://other.example' },
        })
      ).status(),
    ).toBe(403);
    for (let hole = 2; hole <= 9; hole++) {
      expect(
        (await request(hostContext, `/api/rounds/${id}/scores`, 'PUT', { hole, strokes: 4 })).ok(),
      ).toBe(true);
      expect(
        (await request(guestContext, `/api/rounds/${id}/scores`, 'PUT', { hole, strokes: 4 })).ok(),
      ).toBe(true);
    }
    const finished = await request(hostContext, `/api/rounds/${id}`, 'PATCH', {});
    expect(finished.ok()).toBe(true);
    await expect(guest.locator('.live-status')).toContainText('Round complete', { timeout: 5000 });
    expect(
      (
        await request(guestContext, `/api/rounds/${id}/scores`, 'PUT', { hole: 1, strokes: 6 })
      ).status(),
    ).toBe(409);
    await host.goto('/rounds');
    await expect(
      host.locator('.round-row').filter({ hasText: 'Sunday at the links' }),
    ).toContainText('Completed');
    await host.locator('.account-button').click();
    await host.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(host.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await host.getByRole('button', { name: 'Sign in', exact: true }).click();
    await host.getByLabel('Email or username').fill(`alex${suffix}`);
    await host.getByLabel('Password').fill('Fairway-pass-2026!');
    await host.getByRole('dialog').getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(host.locator('.account-button')).toContainText('Alex Morgan');
  } finally {
    await hostContext.close();
    await guestContext.close();
    await outsider.close();
  }
});
test('solo play and mobile home stay usable', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await ctx.newPage();
    await page.goto('/');
    await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const suffix = Date.now();
    const signup = await request(ctx, '/api/auth/sign-up/email', 'POST', {
      email: `solo${suffix}@example.com`,
      password: 'Fairway-pass-2026!',
      name: 'Jamie',
      username: `jamie${suffix}`,
    });
    expect(signup.ok()).toBe(true);
    const created = await request(ctx, '/api/rounds', 'POST', {
      name: 'Solo practice',
      course: 'Westwood',
      nickname: 'Jamie',
      holeCount: 9,
    });
    expect(created.ok()).toBe(true);
    const { id } = await created.json();
    await page.goto(`/round/${id}`);
    await expect(page.locator('.player-count')).toContainText('1 player');
    for (let hole = 1; hole <= 9; hole++)
      expect(
        (await request(ctx, `/api/rounds/${id}/scores`, 'PUT', { hole, strokes: 4 })).ok(),
      ).toBe(true);
    expect((await request(ctx, `/api/rounds/${id}`, 'PATCH', {})).ok()).toBe(true);
    await expect(page.locator('.completed-note')).toContainText('Your scorecard is saved.');
  } finally {
    await ctx.close();
  }
});

test('signed-in joining keeps the invite and edits remain private until saved', async ({
  browser,
}) => {
  const host = await browser.newContext();
  const friend = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const stamp = Date.now();
  try {
    expect(
      (
        await request(host, '/api/auth/sign-up/email', 'POST', {
          email: `host${stamp}@example.com`,
          name: 'Taylor',
          username: `taylor${stamp}`,
          password: 'Fairway-pass-2026!',
        })
      ).ok(),
    ).toBe(true);
    const created = await request(host, '/api/rounds', 'POST', {
      name: 'An evening nine',
      course: 'Willow Creek',
      nickname: 'Taylor',
      holeCount: 9,
      pars: [3, 4, 5, 4, 3, 4, 5, 4, 4],
    });
    expect(created.ok()).toBe(true);
    const { id } = await created.json();
    const round = await (await host.request.get(`/api/rounds/${id}`)).json();
    const page = await friend.newPage();
    await page.goto(`/join?code=${round.inviteCode}`);
    await page.getByRole('button', { name: 'Sign in instead' }).click();
    await page.getByRole('button', { name: 'Create an account' }).click();
    await page.getByLabel('Your name', { exact: true }).fill('Riley');
    await page.getByLabel('Username', { exact: true }).fill(`riley${stamp}`);
    await page.getByLabel('Email', { exact: true }).fill(`riley${stamp}@example.com`);
    await page.getByLabel('Password').fill('Fairway-pass-2026!');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByLabel('Invitation code')).toHaveValue(round.inviteCode);
    await expect(page.getByLabel('Name on the scorecard')).toHaveValue('Riley');
    await page.getByRole('button', { name: 'Join round', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/round/${id}$`));
    await expect(page.locator('.stroke-value strong')).toHaveText('3');
    await page.getByRole('button', { name: 'Increase strokes' }).click();
    expect((await request(host, `/api/rounds/${id}/holes`, 'PUT', { hole: 1, par: 4 })).ok()).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Par 4', exact: true })).toBeVisible();
    await expect(page.locator('.stroke-value strong')).toHaveText('4');
    const before = await (await host.request.get(`/api/rounds/${id}`)).json();
    expect(before.players.find((p: { nickname: string }) => p.nickname === 'Riley').scores).toEqual(
      {},
    );
    await page.getByRole('button', { name: /Save score/ }).click();
    await page.getByRole('button', { name: 'Hole 1, 4 strokes', exact: true }).click();
    await page.getByRole('button', { name: 'Clear this hole’s score' }).click();
    await expect(page.getByRole('button', { name: 'Hole 1', exact: true })).toBeVisible();
    const after = await (await host.request.get(`/api/rounds/${id}`)).json();
    expect(after.players.find((p: { nickname: string }) => p.nickname === 'Riley').scores).toEqual(
      {},
    );
    // Joining on another device using the same account resumes the same participant.
    const secondDevice = await browser.newContext();
    try {
      expect(
        (
          await request(secondDevice, '/api/auth/sign-in/email', 'POST', {
            email: `riley${stamp}@example.com`,
            password: 'Fairway-pass-2026!',
          })
        ).ok(),
      ).toBe(true);
      expect(
        (
          await request(secondDevice, '/api/rounds/join', 'POST', {
            code: round.inviteCode,
            nickname: 'Riley',
          })
        ).ok(),
      ).toBe(true);
      const recovered = await (await secondDevice.request.get(`/api/rounds/${id}`)).json();
      expect(recovered.viewerId).toBe(
        after.players.find((p: { nickname: string }) => p.nickname === 'Riley').id,
      );
      expect(recovered.players).toHaveLength(2);
    } finally {
      await secondDevice.close();
    }
  } finally {
    await host.close();
    await friend.close();
  }
});
