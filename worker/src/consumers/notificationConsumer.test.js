import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleNotification, calculateBackoffDelay } from './notificationConsumer.js';
import * as jobStatus from '../services/jobStatus.js';
import * as emailService from '../services/emailService.js';
import * as queueClient from '../services/queueClient.js';

vi.mock('../services/jobStatus.js');
vi.mock('../services/emailService.js');
vi.mock('../services/queueClient.js');

describe('calculateBackoffDelay', () => {
  it('returns 5s, 10s, 20s for retryCount 0, 1, 2', () => {
    expect(calculateBackoffDelay(0)).toBe(5000);
    expect(calculateBackoffDelay(1)).toBe(10000);
    expect(calculateBackoffDelay(2)).toBe(20000);
  });
});

describe('handleNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets status to processing, then sent, when email delivery succeeds', async () => {
    emailService.sendEmail.mockResolvedValue({ messageId: 'abc123' });

    await handleNotification({
      jobId: 'job-1',
      to: 'matteo@example.com',
      template: 'welcome',
      data: {},
    });

    expect(jobStatus.setJobStatus).toHaveBeenNthCalledWith(1, 'job-1', 'processing');
    expect(jobStatus.setJobStatus).toHaveBeenNthCalledWith(2, 'job-1', 'sent');
    expect(queueClient.publishToRetryQueue).not.toHaveBeenCalled();
    expect(queueClient.publishToDeadLetterQueue).not.toHaveBeenCalled();
  });

  it('schedules a retry with backoff when delivery fails and retries remain', async () => {
    emailService.sendEmail.mockRejectedValue(new Error('SMTP timeout'));

    await handleNotification({
      jobId: 'job-2',
      to: 'matteo@example.com',
      template: 'welcome',
      data: {},
      retryCount: 0,
    });

    expect(jobStatus.setJobStatus).toHaveBeenNthCalledWith(1, 'job-2', 'processing');
    expect(jobStatus.setJobStatus).toHaveBeenNthCalledWith(2, 'job-2', 'retrying');
    expect(queueClient.publishToRetryQueue).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-2', retryCount: 1 }),
      5000
    );
    expect(queueClient.publishToDeadLetterQueue).not.toHaveBeenCalled();
  });

  it('increases the delay exponentially on subsequent retries', async () => {
    emailService.sendEmail.mockRejectedValue(new Error('SMTP timeout'));

    await handleNotification({
      jobId: 'job-3',
      to: 'matteo@example.com',
      template: 'welcome',
      data: {},
      retryCount: 1,
    });

    expect(queueClient.publishToRetryQueue).toHaveBeenCalledWith(
      expect.objectContaining({ retryCount: 2 }),
      10000
    );
  });

  it('moves the job to the dead-letter queue once max retries are exceeded', async () => {
    emailService.sendEmail.mockRejectedValue(new Error('SMTP timeout'));

    await handleNotification({
      jobId: 'job-4',
      to: 'matteo@example.com',
      template: 'welcome',
      data: {},
      retryCount: 3, // equals default MAX_RETRIES -> no more retries
    });

    expect(jobStatus.setJobStatus).toHaveBeenNthCalledWith(2, 'job-4', 'failed');
    expect(queueClient.publishToDeadLetterQueue).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-4', retryCount: 3 })
    );
    expect(queueClient.publishToRetryQueue).not.toHaveBeenCalled();
  });
});