import amqp from 'amqplib';
import { setJobStatus } from '../services/jobStatus.js';
import { sendEmail } from '../services/emailService.js';

const QUEUE_NAME = 'notifications';

export async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`Worker listening on queue "${QUEUE_NAME}"...`);

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const notification = JSON.parse(msg.content.toString());
      const { jobId, to, template, data } = notification;

      console.log('Received notification job:', notification);

      await setJobStatus(jobId, 'processing');

      try {
        await sendEmail({ to, template, data });
        await setJobStatus(jobId, 'sent');
        console.log(`Job ${jobId} sent successfully.`);
      } catch (err) {
        await setJobStatus(jobId, 'failed');
        console.error(`Job ${jobId} failed:`, err.message);
        // TODO: retry logic / dead-letter queue
      }

      channel.ack(msg);
    },
    { noAck: false }
  );

  return { connection, channel };
}