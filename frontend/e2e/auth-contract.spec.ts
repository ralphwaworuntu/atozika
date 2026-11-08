import { expect, test, type APIRequestContext } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const memberEmail = process.env.E2E_MEMBER_EMAIL;
const memberPassword = process.env.E2E_MEMBER_PASSWORD;

function unwrap(body: { data?: unknown } | unknown) {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  return body;
}

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password } });
  expect(res.ok(), `login ${email} ${res.status()}`).toBeTruthy();
  const body = await res.json();
  const data = unwrap(body) as { accessToken: string; user: { role: string } };
  expect(data.accessToken).toBeTruthy();
  return data;
}

test.describe('admin and member API contracts', () => {
  test.skip(!adminEmail || !adminPassword || !memberEmail || !memberPassword, 'set E2E_ADMIN_* and E2E_MEMBER_* credentials');

  test('admin overview, reporting, unique inactive package CRUD, member dashboard', async ({ request }) => {
    const admin = await login(request, adminEmail!, adminPassword!);
    expect(admin.user.role).toBe('ADMIN');
    const auth = { Authorization: `Bearer ${admin.accessToken}` };

    const overview = await request.get('/api/v1/admin/overview', { headers: auth });
    expect(overview.ok()).toBeTruthy();

    const contacts = await request.get('/api/v1/admin/contacts/messages?page=1&limit=10', { headers: auth });
    expect(contacts.ok()).toBeTruthy();
    const contactBody = unwrap(await contacts.json()) as { items?: unknown[]; data?: unknown[] } | unknown[];
    expect(contactBody).toBeTruthy();

    const reporting = await request.get('/api/v1/admin/reporting/summary', { headers: auth });
    expect(reporting.ok()).toBeTruthy();

    const ranking = await request.get('/api/v1/admin/ranking', { headers: auth });
    expect(ranking.ok()).toBeTruthy();

    const stamp = Date.now();
    const slug = `e2e-audit-${stamp}`;
    const created = await request.post('/api/v1/admin/packages', {
      headers: auth,
      data: {
        name: `E2E Audit ${stamp}`,
        slug,
        category: 'AUDIT',
        description: 'Paket uji otomatis, boleh dihapus.',
        price: 0,
        durationDays: 1,
        features: [],
        tryoutQuota: 0,
        moduleQuota: 0,
        cermatQuota: 0,
        isActive: false,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const pkg = unwrap(await created.json()) as { id: string; slug: string; isActive: boolean };
    expect(pkg.slug).toBe(slug);
    expect(pkg.isActive).toBe(false);

    try {
      const updated = await request.put(`/api/v1/admin/packages/${pkg.id}`, {
        headers: auth,
        data: { tagline: '', isActive: false, price: 0 },
      });
      expect(updated.ok()).toBeTruthy();
      const after = unwrap(await updated.json()) as { tagline?: string | null; isActive: boolean; price: number };
      expect(after.isActive).toBe(false);
      expect(after.price).toBe(0);
    } finally {
      const deleted = await request.delete(`/api/v1/admin/packages/${pkg.id}`, { headers: auth });
      expect([200, 204].includes(deleted.status()), `delete ${deleted.status()}`).toBeTruthy();
    }

    const member = await login(request, memberEmail!, memberPassword!);
    expect(member.user.role).toBe('MEMBER');
    const memberAuth = { Authorization: `Bearer ${member.accessToken}` };

    for (const path of [
      '/api/v1/dashboard/overview',
      '/api/v1/dashboard/leaderboard',
      '/api/v1/dashboard/exam-control',
      '/api/v1/materials',
      '/api/v1/exams/tryouts',
      '/api/v1/dashboard/news',
      '/api/v1/commerce/transactions',
      '/api/v1/referrals/me',
    ]) {
      const res = await request.get(path, { headers: memberAuth });
      expect(res.status(), path).toBeLessThan(500);
    }

    const unknown = await request.get('/api/v1/admin/this-route-does-not-exist', { headers: auth });
    expect([404, 405].includes(unknown.status())).toBeTruthy();
  });
});
