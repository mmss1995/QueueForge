import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { startConsumer } from './consumers/notificationConsumer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

startConsumer().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});