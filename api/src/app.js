import express from 'express';
import notificationsRouter from './routes/notifications.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(notificationsRouter);

export default app;