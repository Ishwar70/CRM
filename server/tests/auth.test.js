import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createUser, loginAgent, setupTestApp, TEST_PASSWORD } from './helpers.js';
import { User } from '../src/models/User.js';

let ctx;
beforeAll(async () => {
  ctx = await setupTestApp();
});
beforeEach(async () => {
  await ctx.reset();
});
afterAll(async () => {
  await ctx.teardown();
});

describe('POST /api/auth/login', () => {
  it('sets an HttpOnly cookie and returns the user without the password hash', async () => {
    const user = await createUser({ email: 'admin@test.example', role: 'admin' });
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'ADMIN@test.example ', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: user.email, role: 'admin' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^crm_token=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('returns a generic 401 for a wrong password', async () => {
    const user = await createUser();
    const res = await request(ctx.app).post('/api/auth/login').send({ email: user.email, password: 'wrong-pass' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns the same 401 for an unknown email', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.example', password: TEST_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects inactive users with the same generic message', async () => {
    const user = await createUser({ isActive: false });
    const res = await request(ctx.app).post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('validates the body and rejects operator injection', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors[0].field).toBe('email');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a session', async () => {
    const res = await request(ctx.app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a tampered token', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set('Cookie', 'crm_token=not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid session', async () => {
    const user = await createUser({ name: 'Sam Sales' });
    const agent = await loginAgent(ctx.app, user);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: 'Sam Sales', role: 'sales' });
  });

  it('invalidates the session once the user is deactivated', async () => {
    const user = await createUser();
    const agent = await loginAgent(ctx.app, user);
    await User.updateOne({ _id: user._id }, { isActive: false });
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie so /me is unauthorized afterwards', async () => {
    const user = await createUser();
    const agent = await loginAgent(ctx.app, user);

    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/crm_token=;/);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});
