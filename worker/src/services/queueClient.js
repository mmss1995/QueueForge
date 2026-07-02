import amqp from 'amqplib';

export const MAIN_QUEUE = 'notifications';
export const RETRY_QUEUE = 'notifications.retry';
export const DLQ_QUEUE = 'notifications.dlq';

let connection = null;
let channel = null;

/**
 * Returns a shared channel, declaring all three queues on first use:
 * - MAIN_QUEUE: where the worker consumes from.
 * - RETRY_QUEUE: no consumer attached. Acts as a delay buffer - messages
 *   published here carry a per-message TTL (via `expiration`). Once the TTL
 *   expires, RabbitMQ automatically dead-letters the message back to
 *   MAIN_QUEUE (via the default exchange, using the queue name as routing key).
 * - DLQ_QUEUE: final resting place for jobs that exhausted all retries.
 */
export async function getChannel() {
  if (!channel) {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    channel = await connection.createChannel();

    await channel.assertQueue(MAIN_QUEUE, { durable: true });

    await channel.assertQueue(RETRY_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': MAIN_QUEUE,
      },
    });

    await channel.assertQueue(DLQ_QUEUE, { durable: true });
  }
  return channel;
}

export async function publishToRetryQueue(notification, delayMs) {
  const ch = await getChannel();
  ch.sendToQueue(RETRY_QUEUE, Buffer.from(JSON.stringify(notification)), {
    persistent: true,
    expiration: String(delayMs),
  });
}

export async function publishToDeadLetterQueue(notification) {
  const ch = await getChannel();
  ch.sendToQueue(DLQ_QUEUE, Buffer.from(JSON.stringify(notification)), {
    persistent: true,
  });
}

export async function closeQueueConnection() {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}