import { FastifyInstance } from 'fastify';
import { db } from '../../db';
import { agencies } from '../../db/schema';
import { checkTaskAutomations } from '../../jobs/deadlineCheck';

export async function cronRoutes(app: FastifyInstance) {
  // GET /cron/deadlines - Exposed for Vercel Cron
  // Em produção, você pode adicionar uma validação de Bearer Token 
  // usando o header de auth que a Vercel passa (CRON_SECRET)
  app.get('/cron/deadlines', async (request, reply) => {
    const authHeader = request.headers.authorization;
    
    // Verificação opcional de segurança para o cron da Vercel
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return reply.status(401).send('Unauthorized');
    }

    try {
      // Pega todas as agências ativas
      const allAgencies = await db.select({ id: agencies.id }).from(agencies);
      
      // Roda a verificação de prazos e automações de tarefas para cada agência
      for (const agency of allAgencies) {
        await checkTaskAutomations(agency.id);
      }

      return reply.status(200).send({ success: true, message: `Checked deadlines for ${allAgencies.length} agencies.` });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ message: 'Error running cron job' });
    }
  });
}
