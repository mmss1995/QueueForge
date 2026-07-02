import { setJobStatus } from '../services/jobStatus.js';
import { sendEmail } from '../services/emailService.js';
import {
  getChannel,
  publishToRetryQueue,
  publishToDeadLetterQueue,
  MAIN_QUEUE,
} from '../services/queueClient.js';

const MAX_RETRIES = Number(process.env.MAX_RETRIES) || 3;
const BASE_DELAY_MS = 5000;

/**
 * Exponential backoff: 5s, 10s, 20s, ... based on how many attempts already happened.
 */
export function calculateBackoffDelay(retryCount) {
  return BASE_DELAY_MS * 2 ** retryCount;
}

/**
 * Handles a single notification job: updates status, attempts delivery,
 * and on failure either schedules a retry or moves the job to the DLQ.
 * Kept separate from the AMQP consume loop so it can be unit tested
 * without a real broker/SMTP server.
 */
export async function handleNotification(notification) {
  const { jobId, to, template, data, retryCount = 0 } = notification;

  await setJobStatus(jobId, 'processing');

  try {
    await sendEmail({ to, template, data });
    await setJobStatus(jobId, 'sent');
    console.log(`Job ${jobId} sent successfully.`);
  } catch (err) {
    console.error(`Job ${jobId} failed (attempt ${retryCount + 1}):`, err.message);

    if (retryCount < MAX_RETRIES) {
      const delayMs = calculateBackoffDelay(retryCount);
      await setJobStatus(jobId, 'retrying');
      await publishToRetryQueue({ ...notification, retryCount: retryCount + 1 }, delayMs);
      console.log(`Job ${jobId} scheduled for retry in ${delayMs}ms`);
    } else {
      await setJobStatus(jobId, 'failed');
      await publishToDeadLetterQueue(notification);
      console.error(`Job ${jobId} exceeded max retries, moved to dead-letter queue.`);
    }
  }
}

export async function startConsumer() {
  const channel = await getChannel();

  console.log(`Worker listening on queue "${MAIN_QUEUE}"...`);

  channel.consume(
    MAIN_QUEUE,
    async (msg) => {
      if (!msg) return;

      const notification = JSON.parse(msg.content.toString());
      console.log('Received notification job:', notification);

      await handleNotification(notification);

      channel.ack(msg);
    },
    { noAck: false }
  );

  return channel;
}