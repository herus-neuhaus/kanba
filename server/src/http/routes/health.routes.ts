import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
