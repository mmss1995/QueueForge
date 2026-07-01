import { describe, it, expect, afterAll } from 'vitest';
import amqp from 'amqplib';
import { publishNotification, closeQueueConnection } from './queueClient.js';

const QUEUE_NAME = 'notifications';

describe('RabbitMQ connection - queueClient', () => {
  afterAll(async () => {
    await closeQueueConnection();
  });

  it('publishes a message that can be consumed from the queue', async () => {
    const testJobId = `test-${Date.now()}`;
    const testNotification = {
      type: 'email',
      to: 'matteo@example.com',
      template: 'welcome',
      data: { name: 'Matteo' },
    };

    await publishNotification(testJobId, testNotification);

    // Independent consumer connection, just for verification purposes
    const verifyConnection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost:5672'
    );
    const verifyChannel = await verifyConnection.createChannel();
    await verifyChannel.assertQueue(QUEUE_NAME, { durable: true });

    const receivedMessage = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for message on queue'));
      }, 5000);

      verifyChannel.consume(
        QUEUE_NAME,
        (msg) => {
          if (msg) {
            clearTimeout(timeout);
            const parsed = JSON.parse(msg.content.toString());
            verifyChannel.ack(msg);
            resolve(parsed);
          }
        },
        { noAck: false }
      );
    });

    await verifyChannel.close();
    await verifyConnection.close();

    expect(receivedMessage).toEqual({
      jobId: testJobId,
      ...testNotification,
    });
  });
});