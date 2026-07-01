import { z } from 'zod';

export const notificationSchema = z.object({
  type: z.enum(['email']),
  to: z.string().email(),
  template: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});