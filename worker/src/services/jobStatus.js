import { getRedisClient } from './redisClient.js';

const STATUS_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function setJobStatus(jobId, status) {
  const client = await getRedisClient();
  await client.set(`job:${jobId}:status`, status, { EX: STATUS_TTL_SECONDS });
}