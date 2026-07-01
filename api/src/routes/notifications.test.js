import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('POST /notifications', () => {
  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/notifications')
      .send({
        type: 'email',
        to: 'non-una-email',
        template: 'welcome',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid request');
  });

  it('returns 202 and a jobId for a valid request', async () => {
    const res = await request(app)
      .post('/notifications')
      .send({
        type: 'email',
        to: 'matteo@example.com',
        template: 'welcome',
        data: { name: 'Matteo' },
      });

    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body.status).toBe('pending');
  });

  it('returns 400 when a required field is missing', async () => {
    const res = await request(app)
      .post('/notifications')
      .send({
        type: 'email',
        to: 'matteo@example.com',
      });

    expect(res.status).toBe(400);
  });
});