import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { agencies } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, checkRole } from '../middlewares/auth';
import { env } from '../../config/env';

export async function integrationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // POST /integrations/whatsapp/send
  app.post(
    '/integrations/whatsapp/send',
    {
      preHandler: [checkRole(['owner', 'manager'])],
      schema: {
        body: z.object({
          phone: z.string().min(10),
          message: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      // TODO: Implement simple rate limiting (e.g. fastify-rate-limit) to prevent spam/abuse
      const { phone, message } = request.body as any;
      const { activeAgency } = (request as any).userContext;

      // 1. Fetch agency info to get instance name
      const [agency] = await db
        .select({
          evolutionInstanceName: agencies.evolutionInstanceName,
          whatsappConnected: agencies.whatsappConnected,
        })
        .from(agencies)
        .where(eq(agencies.id, activeAgency.id));

      if (!agency?.whatsappConnected || !agency?.evolutionInstanceName) {
        return reply.status(400).send({ message: 'WhatsApp not connected for this agency' });
      }

      // 2. Call Evolution API from Backend
      try {
        const response = await fetch(`${env.EVOLUTION_BASE_URL}/message/sendText/${agency.evolutionInstanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: phone.replace(/\D/g, ''),
            text: message,
          }),
        });

        if (!response.ok) {
          throw new Error('Evolution API rejected the request');
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ message: 'Failed to send WhatsApp message' });
      }
    }
  );

  // GET /integrations/whatsapp/status
  app.get('/integrations/whatsapp/status', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;

    const [agency] = await db
      .select({
        whatsappConnected: agencies.whatsappConnected,
        evolutionInstanceName: agencies.evolutionInstanceName,
      })
      .from(agencies)
      .where(eq(agencies.id, activeAgency.id));

    return reply.status(200).send({
      whatsappConnected: agency?.whatsappConnected || false,
      evolutionInstanceName: agency?.evolutionInstanceName || null,
    });
  });

  // POST /integrations/whatsapp/instance (To create and return QR code)
  app.post(
    '/integrations/whatsapp/instance',
    {
      preHandler: [checkRole(['owner', 'manager'])],
    },
    async (request, reply) => {
      const { activeAgency } = (request as any).userContext;

      // Ensure instance name
      const instanceName = activeAgency.evolutionInstanceName || `kanba_${activeAgency.id.replace(/-/g, '')}`;

      try {
        // 1. Criar a instância
        await fetch(`${env.EVOLUTION_BASE_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            instanceName,
            token: activeAgency.id, // Auth token opcional
            qrcode: true,
          }),
        });

        // 2. Conectar a instância para pegar o base64 (Isso varia dependendo do spec da v1 ou v2 da Evolution)
        const connectResponse = await fetch(`${env.EVOLUTION_BASE_URL}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': env.EVOLUTION_API_KEY,
          },
        });

        const connectData: any = await connectResponse.json();

        // 3. Atualizar agency no banco com o instance name gerado
        if (!activeAgency.evolutionInstanceName) {
          await db
            .update(agencies)
            .set({ evolutionInstanceName: instanceName })
            .where(eq(agencies.id, activeAgency.id));
        }

        return reply.status(200).send({
          qrcode: connectData?.base64 || connectData?.qrcode,
          instanceName,
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ message: 'Failed to create WhatsApp instance' });
      }
    }
  );

  // DELETE /integrations/whatsapp/instance
  app.delete(
    '/integrations/whatsapp/instance',
    {
      preHandler: [checkRole(['owner', 'manager'])],
    },
    async (request, reply) => {
      const { activeAgency } = (request as any).userContext;

      if (!activeAgency.evolutionInstanceName) {
        return reply.status(400).send({ message: 'No instance found' });
      }

      try {
        // Log out / Delete instance from Evolution
        await fetch(`${env.EVOLUTION_BASE_URL}/instance/delete/${activeAgency.evolutionInstanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': env.EVOLUTION_API_KEY,
          },
        });

        // Atualizar DB
        await db
          .update(agencies)
          .set({ 
            evolutionInstanceName: null,
            whatsappConnected: false 
          })
          .where(eq(agencies.id, activeAgency.id));

        return reply.status(200).send({ message: 'Disconnected' });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ message: 'Failed to delete WhatsApp instance' });
      }
    }
  );
}
