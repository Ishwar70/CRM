import { chromium } from 'playwright-core';
// Browser acceptance run against a freshly seeded stack (`npm run dev:server:memory` + `npm run dev:client`).
// Usage: cd e2e && npm install && CHROME_PATH=/path/to/chrome npm run smoke
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.OUT ?? fileURLToPath(new URL('../docs/screenshots', import.meta.url));
const CHROME_PATH = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const ARCHITECTURE_PAGE = new URL('./architecture.html', import.meta.url).href;
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const consoleErrors = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

let sharedAdminLeadId;
const browser = await chromium.launch({ executablePath: CHROME_PATH, args: ['--no-sandbox'] });

async function newSession(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(`${page.url()} :: ${m.text()}`));
  page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: pageerror ${e.message}`));
  return { context, page };
}

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('DemoPass123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  return page.url();
}

const shot = (page, name, opts = {}) => page.screenshot({ path: `${OUT}/${name}`, ...opts });
const resultCount = async (page) => {
  const text = await page.getByText(/\d+ leads? found/).textContent();
  return Number(text.match(/\d+/)[0]);
};

// ---------- Admin ----------
{
  const { context, page } = await newSession();

  await page.goto(`${BASE}/leads`);
  await page.waitForURL('**/login');
  check('Unauthenticated /leads redirects to /login', page.url().endsWith('/login'));

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  check('Login shows validation errors', await page.getByText('Email is required').isVisible());

  await page.getByLabel('Email').fill('admin@demo-crm.example');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Invalid email or password' }).waitFor();
  check('Wrong password shows generic error', true);

  {
    const fresh = await newSession();
    await fresh.page.goto(`${BASE}/login`);
    await fresh.page.getByRole('heading', { name: /sign in to your account/i }).waitFor();
    await shot(fresh.page, '02-login.png');
    await fresh.context.close();
  }

  const landed = await login(page, 'admin@demo-crm.example');
  check('Login returns user to originally requested page', landed.endsWith('/leads'), landed);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('heading', { name: /Welcome back, Avery/ }).waitFor();
  await page.getByText('Priya Raman').first().waitFor().catch(() => {});
  const totalCard = page.locator('div', { has: page.getByText('Total leads', { exact: true }) }).last();
  const totalText = await totalCard.locator('p.text-3xl').textContent();
  check('Admin dashboard shows all 32 leads', totalText.trim() === '32', `total=${totalText}`);
  check('Admin sees Users nav link', await page.getByRole('link', { name: 'Users' }).isVisible());
  await page.waitForTimeout(300);
  await shot(page, '01-dashboard.png');

  await page.reload();
  await page.getByRole('heading', { name: /Welcome back, Avery/ }).waitFor();
  check('Session restores after refresh', page.url().endsWith('/dashboard'));

  // Leads list, search, filter, paginate
  await page.getByRole('link', { name: 'Leads', exact: true }).click();
  await page.getByText('32 leads found').waitFor();
  check('Admin leads list total 32 with 4 pages', await page.getByText('Page 1 of 4').isVisible());

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('Page 2 of 4').waitFor();
  check('Pagination moves to page 2', page.url().includes('page=2'));

  await page.getByRole('searchbox').fill('solar');
  await page.getByText('1 lead found').waitFor();
  check('Search "solar" finds 1 lead (Sunline Solar)', await page.getByRole('cell', { name: /Amara Nwosu/ }).isVisible());

  await page.getByRole('searchbox').fill('');
  await page.getByText('32 leads found').waitFor();
  await page.getByLabel('Status').selectOption('qualified');
  await page.waitForFunction(() => /\b\d+ leads? found/.test(document.body.innerText) && location.search.includes('status=qualified'));
  await page.waitForTimeout(400);
  const qualified = await resultCount(page);
  const badges = await page.locator('table tbody td:nth-child(3)').allTextContents();
  check('Status filter = qualified', qualified > 0 && badges.every((b) => b === 'Qualified'), `count=${qualified}`);

  await page.getByLabel('Assignee').selectOption({ label: 'Sam Sales' });
  await page.waitForTimeout(500);
  const combined = await resultCount(page);
  const assignees = await page.locator('table tbody td:nth-child(6)').allTextContents();
  check('Status + assignee filters combine', combined < qualified && assignees.every((a) => a === 'Sam Sales'), `count=${combined}`);

  await page.getByLabel('Assignee').selectOption('');
  await page.getByLabel('Sort').selectOption('-estimatedValue');
  await page.waitForTimeout(500);
  await page.locator('h1').click();
  await shot(page, '03-leads-list-filters.png');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByText('32 leads found').waitFor();
  check('Reset clears filters', true);

  // Create
  await page.getByRole('link', { name: 'New lead' }).click();
  await page.getByRole('button', { name: 'Create lead' }).click();
  check('Create form validates required name', await page.getByText('Name is required').isVisible());
  await page.getByLabel(/^Name/).fill('Jordan Ellis');
  await page.getByLabel('Company').fill('Starling Robotics');
  await page.getByLabel('Email').fill('jordan.ellis@starling');
  await page.getByLabel('Phone').fill('+1 555-0199');
  await page.getByLabel('Status *').selectOption('contacted').catch(() => page.getByLabel(/^Status/).selectOption('contacted'));
  await page.getByLabel(/^Priority/).selectOption('high');
  await page.getByLabel('Source').selectOption('linkedin');
  await page.getByLabel(/Estimated value/).fill('27000');
  await page.getByLabel('Assigned to').selectOption({ label: 'Riley Reyes' });
  await page.getByLabel('Notes').fill('Met at RoboExpo. Wants a pilot for 3 warehouses in Q1.');
  await page.getByRole('button', { name: 'Create lead' }).click();
  check('Invalid email is rejected client-side', await page.getByText('Enter a valid email').isVisible());
  await shot(page, '04-lead-form.png', { fullPage: true });
  await page.getByLabel('Email').fill('jordan.ellis@starling.example');
  await page.getByRole('button', { name: 'Create lead' }).click();
  await page.getByRole('heading', { name: 'Jordan Ellis' }).waitFor();
  check('Lead created and detail page shown', await page.getByText('Lead "Jordan Ellis" created').isVisible());
  check('Admin assignment stored (Riley Reyes)', await page.getByText('Riley Reyes').isVisible());
  const newLeadUrl = page.url();

  // Edit
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel(/^Status/).selectOption('qualified');
  await page.getByLabel(/Estimated value/).fill('31500');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Lead updated').waitFor();
  check('Edit persists status and value', (await page.getByText('$31,500').isVisible()) && (await page.locator('dd').getByText('Qualified').isVisible()));
  await page.waitForTimeout(4200);
  await shot(page, '05-lead-detail.png');

  // Delete
  await page.getByRole('button', { name: 'Delete' }).click();
  const dialog = page.getByRole('alertdialog');
  check('Delete asks for confirmation', await dialog.isVisible());
  check('Dialog focuses Cancel', await page.evaluate(() => document.activeElement?.textContent === 'Cancel'));
  await dialog.getByRole('button', { name: 'Delete lead' }).click();
  await page.waitForURL('**/leads');
  await page.getByText('32 leads found').waitFor();
  check('Admin delete removes lead (back to 32)', true);
  await page.goto(newLeadUrl);
  check('Deleted lead shows not found', await page.getByText('Lead not found').isVisible({ timeout: 5000 }).catch(() => false) || (await page.getByText('Lead not found').waitFor().then(() => true)));

  // Users
  await page.getByRole('link', { name: 'Users' }).click();
  await page.getByRole('button', { name: 'Deactivate Riley Reyes' }).waitFor();
  await page.getByRole('button', { name: 'New user' }).click();
  await page.getByLabel(/Full name/).fill('Taylor Brooks');
  await page.getByLabel(/^Email/).fill('taylor@demo-crm.example');
  await page.getByLabel(/Temporary password/).fill('DemoPass123!');
  await page.getByRole('button', { name: 'Create user' }).click();
  await page.getByText('User Taylor Brooks created').waitFor();
  await page.getByRole('button', { name: 'Deactivate Taylor Brooks' }).click();
  await page.getByRole('button', { name: 'Activate Taylor Brooks' }).waitFor();
  check('Admin creates and deactivates a user', true);
  await page.waitForTimeout(4200);
  await shot(page, '06-admin-users.png');

  const adminLeadId = await page.evaluate(async () => {
    const r = await fetch('/api/leads?limit=50', { credentials: 'include' });
    const { data } = await r.json();
    return data.items.find((l) => l.assignedTo.name === 'Avery Admin')._id;
  });
  sharedAdminLeadId = adminLeadId;

  // Logout
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForURL('**/login');
  check('Logout invalidates session (protected route redirects)', page.url().endsWith('/login'));
  await context.close();
}

// ---------- Sales ----------
{
  const { context, page } = await newSession();
  await login(page, 'sales@demo-crm.example');
  await page.getByRole('heading', { name: /Welcome back, Sam/ }).waitFor();
  await page.waitForTimeout(500);
  const totalCard = page.locator('div', { has: page.getByText('Total leads', { exact: true }) }).last();
  const total = (await totalCard.locator('p.text-3xl').textContent()).trim();
  check('Sales dashboard is role-filtered (13 leads)', total === '13', `total=${total}`);
  check('Sales has no Users nav link', !(await page.getByRole('link', { name: 'Users' }).isVisible()));

  await page.goto(`${BASE}/users`);
  await page.getByText('You do not have access to that page.').waitFor();
  check('Sales direct /users is blocked and redirected', page.url().endsWith('/dashboard'));

  await page.getByRole('link', { name: 'Leads', exact: true }).click();
  await page.getByText('13 leads found').waitFor();
  check('Sales list shows only own leads', true);
  check('Sales has no assignee filter', !(await page.getByLabel('Assignee').isVisible().catch(() => false)));

  await page.getByRole('link', { name: 'New lead' }).click();
  await page.getByRole('heading', { name: 'New lead' }).waitFor();
  check('Sales form shows "Assigned to: You"', await page.getByText('You', { exact: true }).isVisible());
  await page.getByLabel(/^Name/).fill('Morgan Avery');
  await page.getByLabel('Company').fill('Fernhill Bakery');
  await page.getByRole('button', { name: 'Create lead' }).click();
  await page.getByRole('heading', { name: 'Morgan Avery' }).waitFor();
  check('Sales-created lead auto-assigned to self', await page.locator('dd').getByText('Sam Sales').first().isVisible());
  check('Sales sees no Delete button', !(await page.getByRole('button', { name: 'Delete' }).isVisible()));

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel(/^Status/).selectOption('contacted');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Lead updated').waitFor();
  check('Sales can edit own lead', true);

  const adminLeadId = sharedAdminLeadId;
  const api = await page.evaluate(async (id) => {
    const get = await fetch(`/api/leads/${id}`, { credentials: 'include' });
    const patch = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'won' }),
    });
    const del = await fetch(`/api/leads/${id}`, { method: 'DELETE', credentials: 'include' });
    const users = await fetch('/api/users', { credentials: 'include' });
    return { get: get.status, patch: patch.status, del: del.status, users: users.status };
  }, adminLeadId);
  check("Sales API: other user's lead GET/PATCH → 404", api.get === 404 && api.patch === 404, JSON.stringify(api));
  check('Sales API: DELETE → 403, /api/users → 403', api.del === 403 && api.users === 403);

  await page.goto(`${BASE}/leads/${adminLeadId}`);
  await page.getByText('Lead not found').waitFor();
  check("Sales opening another user's lead URL sees not-found", true);
  await context.close();
}

// ---------- Mobile ----------
for (const width of [390, 320]) {
  const { context, page } = await newSession({ width, height: 844 });
  await login(page, 'admin@demo-crm.example');
  await page.goto(`${BASE}/leads`);
  await page.getByText(/3\d leads found/).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const cardsVisible = await page.locator('ul.md\\:hidden li').first().isVisible();
  check(`Mobile ${width}px: cards layout, no horizontal overflow`, cardsVisible && overflow <= 0, `overflow=${overflow}`);
  check(`Mobile ${width}px: filters collapsed by default`, !(await page.getByLabel('Status').isVisible()));
  await page.getByRole('button', { name: /Filters & sort/ }).click();
  await page.getByLabel('Status').selectOption('won');
  await page.waitForFunction(() => location.search.includes('status=won'));
  await page.getByText(/\d+ leads? found/).waitFor();
  check(`Mobile ${width}px: filter toggle works`, await page.getByRole('button', { name: 'Hide filters' }).isVisible());
  await page.getByRole('button', { name: 'Hide filters' }).click();
  await page.getByRole('button', { name: 'Filters & sort (1)' }).waitFor();
  await page.goto(`${BASE}/leads`);
  await page.getByText(/3\d leads found/).waitFor();
  if (width === 390) {
    await shot(page, '07-mobile-leads.png');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    check('Mobile nav drawer opens', await page.getByRole('dialog', { name: 'Navigation' }).isVisible());
    await page.keyboard.press('Escape');
  }
  await context.close();
}

// ---------- Architecture image ----------
{
  const { context, page } = await newSession({ width: 1440, height: 760 });
  await page.goto(ARCHITECTURE_PAGE);
  await shot(page, '08-architecture.png');
  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
const unexpectedConsole = consoleErrors.filter(
  (e) => !/401 \(Unauthorized\)|403 \(Forbidden\)|404 \(Not Found\)|400 \(Bad Request\)/.test(e),
);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`Console errors (excluding expected 4xx network logs): ${unexpectedConsole.length}`);
unexpectedConsole.forEach((e) => console.log('  ', e));
process.exit(failed.length || unexpectedConsole.length ? 1 : 0);
