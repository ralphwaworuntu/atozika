import { expect, test } from '@playwright/test';

test('public pages respond', async ({ request }) => {
  for (const path of ['/', '/profil', '/paket-bimbel', '/galeri', '/testimoni', '/hubungi-kami']) {
    const res = await request.get(path);
    expect(res.status(), path).toBeLessThan(400);
  }
});

test('health and landing contracts', async ({ request }) => {
  const health = await request.get('/api/v1/health');
  expect(health.ok()).toBeTruthy();
  const body = await health.json();
  expect(body.status).toBe('ok');

  const home = await request.get('/api/v1/landing/home');
  expect(home.ok()).toBeTruthy();
  const payload = await home.json();
  const data = payload.data ?? payload;
  expect(data.hero).toBeTruthy();
  expect(Array.isArray(data.stats)).toBeTruthy();
  expect(Array.isArray(data.testimonials)).toBeTruthy();
});
