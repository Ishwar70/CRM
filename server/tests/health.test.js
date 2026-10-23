import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp } from './helpers.js';

let ctx;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => {
  await ctx.teardown();
});

describe('GET /api/health', () => {
  it('returns ok with db state', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok', db: 'connected' } });
  });

  it('returns structured 404 for unknown routes', async () => {
    const res = await request(ctx.app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Route not found/);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(ctx.app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Malformed JSON body' });
  });
});

describe('loadEnv', () => {
  it('throws on missing required values', async () => {
    const { loadEnv } = await import('../src/config/env.js');
    expect(() => loadEnv({})).toThrow(/MONGODB_URI/);
  });
});
