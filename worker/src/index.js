import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { startConsumer } from './consumers/notificationConsumer.js';
import { resolveEnvFile } from 'shared/resolveEnvFile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile = resolveEnvFile(process.env.NODE_ENV);
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

startConsumer().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});