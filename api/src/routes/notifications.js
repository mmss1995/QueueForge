import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { notificationSchema } from '../validation/notification.js';
import { setJobStatus, getJobStatus } from '../services/jobStatus.js';

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

  await setJobStatus(jobId, 'pending');

  // TODO: publish `notification` + jobId to RabbitMQ queue

  res.status(202).json({ jobId, status: 'pending' });
});

router.get('/notifications/:jobId/status', async (req, res) => {
  const { jobId } = req.params;
  const status = await getJobStatus(jobId);

  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.status(200).json({ jobId, status });
});

export default router;