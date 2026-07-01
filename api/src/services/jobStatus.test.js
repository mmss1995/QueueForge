import { describe, it, expect, afterAll } from 'vitest';
import { setJobStatus, getJobStatus } from './jobStatus.js';
import { closeRedisClient } from './redisClient.js';

describe('Redis connection - job status', () => {
  afterAll(async () => {
    await closeRedisClient();
  });

  it('connects to Redis and can set/get a job status', async () => {
    const testJobId = `test-${Date.now()}`;

    await setJobStatus(testJobId, 'pending');
    const status = await getJobStatus(testJobId);

    expect(status).toBe('pending');
  });

  it('returns null for a jobId that does not exist', async () => {
    const status = await getJobStatus('non-existent-job-id');
    expect(status).toBeNull();
  });
});