import { QueueEvents, Worker } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function createUxError({ code, title, detail, fix, raw } = {}) {
  return {
    code: code || 'worker_error',
    title: title || 'Runner error',
    detail: detail || 'The runner failed to process the job.',
    fix: fix || 'Retry the job or inspect runner logs.',
    raw: raw || null
  };
}

async function processJob(job) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await delay(500);

  const result = {
    summary: `Job ${job.id} (${job.data.type}) executed.` ,
    logs: [`Job ${job.id} started`, `Job ${job.id} finished`],
    artifacts: []
  };

  return result;
}

const worker = new Worker(
  'algomind-jobs',
  async (job) => {
    try {
      return await processJob(job);
    } catch (error) {
      throw createUxError({ raw: error });
    }
  },
  {
    connection: {
      url: REDIS_URL
    }
  }
);

const events = new QueueEvents('algomind-jobs', {
  connection: {
    url: REDIS_URL
  }
});

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed`, result);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

events.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed`, failedReason);
});

events.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} completed`, returnvalue);
});

worker.on('error', (err) => {
  console.error('Worker error', err);
});
