import { FastifyInstance } from 'fastify';
import { DbHealthService } from '../../services/db-health.service';

export async function debugRoutes(app: FastifyInstance) {
  app.get('/debug/db-health', async (request, reply) => {
    const health = await DbHealthService.checkConnection();
    
    if (!health.connected) {
      return reply.status(500).send(health);
    }
    
    return reply.status(200).send(health);
  });
}
