import Fastify from 'fastify';
import { z } from 'zod';
import { queue } from './queue.js';

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'SYS:standard' }
    }
  }
});

const jobSchema = z.object({
  type: z.enum(['TEST', 'SIMULATE', 'DEPLOY']),
  payload: z.record(z.any()).optional()
});

fastify.get('/health', async () => {
  return { status: 'ok', redis: Boolean(REDIS_URL) };
});

fastify.post('/jobs', async (request, reply) => {
  const parsed = jobSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.format() };
  }

  const job = await queue.add('job', parsed.data);
  reply.code(202);
  return { id: job.id, status: job.state || 'queued' };
});

fastify.get('/jobs/:id', async (request, reply) => {
  const { id } = request.params;
  const job = await queue.getJob(id);
  if (!job) {
    reply.code(404);
    return { error: 'Job not found' };
  }

  const state = await job.getState();
  const result = job.returnvalue || null;

  return { id: job.id, state, result };
});

fastify.listen({ port: Number(PORT), host: '0.0.0.0' })
  .then(() => fastify.log.info(`API listening on ${PORT}`))
  .catch((err) => {
    fastify.log.error(err, 'Failed to start server');
    process.exit(1);
  });
