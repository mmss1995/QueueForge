import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { closeRedisClient } from '../services/redisClient.js';
import { closeQueueConnection } from '../services/queueClient.js';

describe('POST /notifications', () => {
  afterAll(async () => {
    await closeRedisClient();
    await closeQueueConnection();
  });

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

  it('returns 202 and a jobId for a valid request, and status is queryable', async () => {
    const postRes = await request(app)
      .post('/notifications')
      .send({
        type: 'email',
        to: 'matteo@example.com',
        template: 'welcome',
        data: { name: 'Matteo' },
      });

    expect(postRes.status).toBe(202);
    expect(postRes.body).toHaveProperty('jobId');
    expect(postRes.body.status).toBe('pending');

    const { jobId } = postRes.body;

    const statusRes = await request(app).get(`/notifications/${jobId}/status`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toEqual({ jobId, status: 'pending' });
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

  it('returns 404 when querying status for a non-existent jobId', async () => {
    const res = await request(app).get('/notifications/non-existent-job-id/status');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Job not found');
  });
});