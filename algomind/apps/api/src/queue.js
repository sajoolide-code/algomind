import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const queue = new Queue('algomind-jobs', {
  connection: {
    url: REDIS_URL
  }
});
