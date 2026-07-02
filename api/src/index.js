import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import app from './app.js';
import { resolveEnvFile } from 'shared/resolveEnvFile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile = resolveEnvFile(process.env.NODE_ENV);
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});