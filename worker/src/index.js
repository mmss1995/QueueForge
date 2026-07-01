import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { startConsumer } from './consumers/notificationConsumer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

startConsumer().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});