import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { notificationSchema } from '../validation/notifications.js';

const router = Router();

router.post('/notifications', async (req, res) => {
  const parseResult = notificationSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parseResult.error.flatten(),
    });
  }

  const jobId = uuidv4();
  const notification = parseResult.data;

  // TODO: store initial status 'pending' in Redis
  // TODO: publish `notification` + jobId to RabbitMQ queue

  res.status(202).json({ jobId, status: 'pending' });
});

export default router;