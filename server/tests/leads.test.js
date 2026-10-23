import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createUser, loginAgent, setupTestApp } from './helpers.js';
import { Lead } from '../src/models/Lead.js';

let ctx;
let admin;
let sales;
let otherSales;
let adminAgent;
let salesAgent;

async function makeLead(overrides = {}) {
  return Lead.create({ name: 'Default Lead', assignedTo: admin._id, createdBy: admin._id, ...overrides });
}

beforeAll(async () => {
  ctx = await setupTestApp();
});
beforeEach(async () => {
  await ctx.reset();
  admin = await createUser({ name: 'Ada Admin', role: 'admin' });
  sales = await createUser({ name: 'Sam Sales' });
  otherSales = await createUser({ name: 'Olga Other' });
  adminAgent = await loginAgent(ctx.app, admin);
  salesAgent = await loginAgent(ctx.app, sales);
});
afterAll(async () => {
  await ctx.teardown();
});

describe('authentication', () => {
  it('requires a session for every lead route', async () => {
    const res = await request(ctx.app).get('/api/leads');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/leads', () => {
  it('lets Admin create and assign a lead to another user', async () => {
    const res = await adminAgent.post('/api/leads').send({
      name: 'Acme Prospect',
      email: 'buyer@acme.example',
      company: 'Acme',
      status: 'qualified',
      estimatedValue: 5000,
      assignedTo: String(sales._id),
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Lead created');
    expect(res.body.data.lead).toMatchObject({
      name: 'Acme Prospect',
      status: 'qualified',
      priority: 'medium',
      source: 'other',
      assignedTo: { name: 'Sam Sales' },
      createdBy: { name: 'Ada Admin' },
    });
    expect(await Lead.countDocuments()).toBe(1);
  });

  it('auto-assigns Sales-created leads to the creator even if another assignee is sent', async () => {
    const res = await salesAgent
      .post('/api/leads')
      .send({ name: 'Self Assigned', assignedTo: String(otherSales._id) });
    expect(res.status).toBe(201);
    expect(res.body.data.lead.assignedTo._id).toBe(String(sales._id));
  });

  it('rejects assignment to an inactive user', async () => {
    const inactive = await createUser({ isActive: false });
    const res = await adminAgent.post('/api/leads').send({ name: 'Lead X', assignedTo: String(inactive._id) });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'assignedTo', message: 'Assignee must be an active user' }]);
  });

  it.each([
    [{}, 'name', 'Name is required'],
    [{ name: 'A' }, 'name', 'Name must be at least 2 characters'],
    [{ name: 'Valid', status: 'archived' }, 'status', expect.stringMatching(/Status must be one of/)],
    [{ name: 'Valid', estimatedValue: -1 }, 'estimatedValue', 'Estimated value cannot be negative'],
    [{ name: 'Valid', email: 'not-an-email' }, 'email', expect.any(String)],
    [{ name: 'Valid', notes: 'x'.repeat(2001) }, 'notes', 'Notes must be at most 2000 characters'],
  ])('returns 400 with field errors for %j', async (body, field, message) => {
    const res = await adminAgent.post('/api/leads').send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toContainEqual({ field, message });
  });

  it('rejects unknown fields such as createdBy', async () => {
    const res = await salesAgent.post('/api/leads').send({ name: 'Sneaky', createdBy: String(admin._id) });
    expect(res.status).toBe(400);
  });
});

describe('ownership and authorization', () => {
  it('Admin sees every lead; Sales sees only their own', async () => {
    await makeLead({ name: 'Admin Lead' });
    await makeLead({ name: 'Sales Lead', assignedTo: sales._id });
    await makeLead({ name: 'Other Lead', assignedTo: otherSales._id });

    const adminRes = await adminAgent.get('/api/leads');
    expect(adminRes.body.data.total).toBe(3);

    const salesRes = await salesAgent.get('/api/leads');
    expect(salesRes.body.data.total).toBe(1);
    expect(salesRes.body.data.items[0].name).toBe('Sales Lead');
  });

  it('ignores the assignedTo filter for Sales so they cannot list other users’ leads', async () => {
    await makeLead({ name: 'Other Lead', assignedTo: otherSales._id });
    const res = await salesAgent.get('/api/leads').query({ assignedTo: String(otherSales._id) });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });

  it('Sales cannot read or update another user’s lead (404)', async () => {
    const lead = await makeLead({ assignedTo: otherSales._id });
    expect((await salesAgent.get(`/api/leads/${lead._id}`)).status).toBe(404);
    const patch = await salesAgent.patch(`/api/leads/${lead._id}`).send({ status: 'won' });
    expect(patch.status).toBe(404);
    expect((await Lead.findById(lead._id)).status).toBe('new');
  });

  it('Sales cannot reassign their own lead (403)', async () => {
    const lead = await makeLead({ assignedTo: sales._id });
    const res = await salesAgent.patch(`/api/leads/${lead._id}`).send({ assignedTo: String(otherSales._id) });
    expect(res.status).toBe(403);
  });

  it('Sales cannot delete leads, even their own (403)', async () => {
    const lead = await makeLead({ assignedTo: sales._id });
    const res = await salesAgent.delete(`/api/leads/${lead._id}`);
    expect(res.status).toBe(403);
    expect(await Lead.countDocuments()).toBe(1);
  });

  it('Admin can delete any lead', async () => {
    const lead = await makeLead({ assignedTo: otherSales._id });
    const res = await adminAgent.delete(`/api/leads/${lead._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lead deleted');
    expect(await Lead.countDocuments()).toBe(0);
    expect((await adminAgent.delete(`/api/leads/${lead._id}`)).status).toBe(404);
  });

  it('returns 400 for malformed ids', async () => {
    const res = await adminAgent.get('/api/leads/not-an-id');
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toEqual({ field: 'id', message: 'Invalid id' });
  });
});

describe('PATCH /api/leads/:id', () => {
  it('Sales can update their own lead and changes persist', async () => {
    const lead = await makeLead({ assignedTo: sales._id });
    const res = await salesAgent
      .patch(`/api/leads/${lead._id}`)
      .send({ status: 'contacted', notes: 'Called, follow up Friday', estimatedValue: 1200 });
    expect(res.status).toBe(200);
    expect(res.body.data.lead).toMatchObject({ status: 'contacted', estimatedValue: 1200 });
    expect((await Lead.findById(lead._id)).notes).toBe('Called, follow up Friday');
  });

  it('Admin can reassign a lead', async () => {
    const lead = await makeLead();
    const res = await adminAgent.patch(`/api/leads/${lead._id}`).send({ assignedTo: String(sales._id) });
    expect(res.status).toBe(200);
    expect(res.body.data.lead.assignedTo.name).toBe('Sam Sales');
  });

  it('rejects invalid updates and empty bodies', async () => {
    const lead = await makeLead();
    expect((await adminAgent.patch(`/api/leads/${lead._id}`).send({ priority: 'urgent' })).status).toBe(400);
    expect((await adminAgent.patch(`/api/leads/${lead._id}`).send({})).status).toBe(400);
  });
});

describe('GET /api/leads list query', () => {
  beforeEach(async () => {
    const docs = [];
    for (let i = 0; i < 12; i += 1) {
      docs.push({
        name: `Acme Contact ${String(i).padStart(2, '0')}`,
        company: 'Acme Corp',
        status: i % 2 ? 'qualified' : 'new',
        assignedTo: i < 9 ? sales._id : otherSales._id,
        createdBy: admin._id,
      });
    }
    docs.push({ name: 'Zenith Buyer', company: 'Zenith Ltd', status: 'qualified', assignedTo: sales._id, createdBy: admin._id });
    await Lead.insertMany(docs);
  });

  it('combines search, status, assignee, pagination and sort with correct metadata', async () => {
    const res = await adminAgent.get('/api/leads').query({
      search: 'acme',
      status: 'qualified',
      assignedTo: String(sales._id),
      page: 2,
      limit: 2,
      sort: 'name',
    });
    expect(res.status).toBe(200);
    const { items, page, limit, total, totalPages } = res.body.data;
    // Acme + qualified + assigned to sales => indexes 1,3,5,7
    expect({ page, limit, total, totalPages }).toEqual({ page: 2, limit: 2, total: 4, totalPages: 2 });
    expect(items.map((l) => l.name)).toEqual(['Acme Contact 05', 'Acme Contact 07']);
  });

  it('treats regex characters in search literally', async () => {
    const res = await adminAgent.get('/api/leads').query({ search: '.*' });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });

  it('defaults to page 1, limit 10 and newest first', async () => {
    const res = await adminAgent.get('/api/leads');
    expect(res.body.data).toMatchObject({ page: 1, limit: 10, total: 13, totalPages: 2 });
    expect(res.body.data.items).toHaveLength(10);
  });

  it('rejects operator injection and unknown query params', async () => {
    expect((await adminAgent.get('/api/leads?status[$ne]=new')).status).toBe(400);
    expect((await adminAgent.get('/api/leads?foo=bar')).status).toBe(400);
    expect((await adminAgent.get('/api/leads?limit=1000')).status).toBe(400);
    expect((await adminAgent.get('/api/leads?sort=passwordHash')).status).toBe(400);
  });
});
