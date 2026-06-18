import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { inAppNotifications } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth } from '../middlewares/auth';

export async function inAppNotificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // 1. Listar notificações do usuário
  app.get('/notifications', async (request, reply) => {
    const userId = (request as any).userContext.user.id;
    
    const notifications = await db
      .select()
      .from(inAppNotifications)
      .where(eq(inAppNotifications.recipientId, userId))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(50);

    return reply.status(200).send(notifications);
  });

  // 2. Marcar notificação como lida
  app.patch(
    '/notifications/:id/read',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const userId = (request as any).userContext.user.id;

      await db
        .update(inAppNotifications)
        .set({ isRead: true })
        .where(
          and(
            eq(inAppNotifications.id, id),
            eq(inAppNotifications.recipientId, userId)
          )
        );

      return reply.status(200).send({ success: true });
    }
  );

  // 3. Marcar todas como lidas
  app.patch('/notifications/read-all', async (request, reply) => {
    const userId = (request as any).userContext.user.id;

    await db
      .update(inAppNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(inAppNotifications.recipientId, userId),
          eq(inAppNotifications.isRead, false)
        )
      );

    return reply.status(200).send({ success: true });
  });
}
