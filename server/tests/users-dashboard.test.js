import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createUser, loginAgent, setupTestApp } from './helpers.js';
import { Lead } from '../src/models/Lead.js';
import { User } from '../src/models/User.js';

let ctx;
let admin;
let sales;
let adminAgent;
let salesAgent;

beforeAll(async () => {
  ctx = await setupTestApp();
});
beforeEach(async () => {
  await ctx.reset();
  admin = await createUser({ name: 'Ada Admin', role: 'admin' });
  sales = await createUser({ name: 'Sam Sales' });
  adminAgent = await loginAgent(ctx.app, admin);
  salesAgent = await loginAgent(ctx.app, sales);
});
afterAll(async () => {
  await ctx.teardown();
});

describe('/api/users (Admin only)', () => {
  it('blocks unauthenticated and non-admin users', async () => {
    expect((await request(ctx.app).get('/api/users')).status).toBe(401);
    const res = await salesAgent.get('/api/users');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect((await salesAgent.post('/api/users').send({ name: 'X Y', email: 'x@y.example', password: 'Password1!' })).status).toBe(403);
    expect((await salesAgent.patch(`/api/users/${admin._id}/status`).send({ isActive: false })).status).toBe(403);
  });

  it('lists users with lead counts and without password hashes', async () => {
    await Lead.create({ name: 'Lead One', assignedTo: sales._id, createdBy: admin._id });
    const res = await adminAgent.get('/api/users');
    expect(res.status).toBe(200);
    const samRow = res.body.data.users.find((u) => u.name === 'Sam Sales');
    expect(samRow).toMatchObject({ leadCount: 1, role: 'sales', isActive: true });
    expect(samRow.passwordHash).toBeUndefined();
  });

  it('creates a user who can then sign in', async () => {
    const res = await adminAgent
      .post('/api/users')
      .send({ name: 'New Rep', email: 'New.Rep@Test.example', password: 'SecurePass1', role: 'sales' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'new.rep@test.example', role: 'sales' });

    const login = await request(ctx.app).post('/api/auth/login').send({ email: 'new.rep@test.example', password: 'SecurePass1' });
    expect(login.status).toBe(200);
  });

  it('validates new users and rejects duplicate emails with 409', async () => {
    const bad = await adminAgent.post('/api/users').send({ name: 'N', email: 'bad', password: 'short', role: 'boss' });
    expect(bad.status).toBe(400);
    expect(bad.body.errors.map((e) => e.field).sort()).toEqual(['email', 'name', 'password', 'role']);

    const dup = await adminAgent.post('/api/users').send({ name: 'Dup User', email: sales.email, password: 'Password1!' });
    expect(dup.status).toBe(409);
    expect(dup.body.errors).toEqual([{ field: 'email', message: 'Email is already in use' }]);
  });

  it('deactivates a user, which blocks their login and existing session', async () => {
    const res = await adminAgent.patch(`/api/users/${sales._id}/status`).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User deactivated');
    expect((await User.findById(sales._id)).isActive).toBe(false);
    expect((await salesAgent.get('/api/auth/me')).status).toBe(401);

    const reactivated = await adminAgent.patch(`/api/users/${sales._id}/status`).send({ isActive: true });
    expect(reactivated.body.data.user.isActive).toBe(true);
  });

  it('prevents an admin from deactivating themselves', async () => {
    const res = await adminAgent.patch(`/api/users/${admin._id}/status`).send({ isActive: false });
    expect(res.status).toBe(400);
  });

  it('exposes assignable users to any signed-in user, scoped for Sales', async () => {
    const adminRes = await adminAgent.get('/api/users/assignable');
    expect(adminRes.body.data.users).toHaveLength(2);
    const salesRes = await salesAgent.get('/api/users/assignable');
    expect(salesRes.body.data.users).toEqual([{ _id: String(sales._id), name: 'Sam Sales', role: 'sales' }]);
  });
});

describe('GET /api/dashboard/stats', () => {
  beforeEach(async () => {
    const base = { createdBy: admin._id };
    await Lead.insertMany([
      { ...base, name: 'A1', status: 'new', estimatedValue: 100, assignedTo: admin._id },
      { ...base, name: 'A2', status: 'won', estimatedValue: 1000, assignedTo: admin._id },
      { ...base, name: 'S1', status: 'qualified', estimatedValue: 500, assignedTo: sales._id },
      { ...base, name: 'S2', status: 'won', estimatedValue: 250, assignedTo: sales._id },
      { ...base, name: 'S3', status: 'lost', assignedTo: sales._id },
    ]);
  });

  it('returns global totals for Admin', async () => {
    const res = await adminAgent.get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({ total: 5, new: 1, contacted: 0, qualified: 1, won: 2, lost: 1 });
    expect(res.body.data.pipelineValue).toBe(600);
    expect(res.body.data.wonValue).toBe(1250);
    expect(res.body.data.recentLeads).toHaveLength(5);
  });

  it('returns only the Sales user’s own numbers', async () => {
    const res = await salesAgent.get('/api/dashboard/stats');
    expect(res.body.data.totals).toEqual({ total: 3, new: 0, contacted: 0, qualified: 1, won: 1, lost: 1 });
    expect(res.body.data.recentLeads.every((l) => l.assignedTo._id === String(sales._id))).toBe(true);
  });
});
