import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import app from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});