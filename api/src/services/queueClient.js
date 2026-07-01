import amqp from 'amqplib';

const QUEUE_NAME = 'notifications';

let connection = null;
let channel = null;

export async function getChannel() {
  if (!channel) {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
  }
  return channel;
}

export async function publishNotification(jobId, notification) {
  const ch = await getChannel();
  const message = { jobId, ...notification };

  ch.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
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