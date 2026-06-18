import { FastifyInstance } from 'fastify';
import z from 'zod';
import { verifyAuth, checkRole } from '../middlewares/auth';
import { NotificationService } from '../../services/notifications/NotificationService';

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  app.post(
    '/notifications/notify',
    {
      preHandler: [checkRole(['owner', 'manager', 'member'])],
      schema: {
        body: z.object({
          taskId: z.string().uuid(),
          type: z.enum(['creation', 'due_date', 'overdue', 'pending_approval', 'stale_approval', 'no_update', 'mention']),
          phone: z.string(),
          message: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { taskId, type, phone, message } = request.body as any;
      await NotificationService.logAndNotify(taskId, type, phone, message);
      return reply.status(200).send({ success: true });
    }
  );

  app.post(
    '/notifications/mention',
    {
      preHandler: [checkRole(['owner', 'manager', 'member'])],
      schema: {
        body: z.object({
          commentId: z.string().uuid(),
          taskId: z.string().uuid(),
          phone: z.string(),
          message: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { commentId, taskId, phone, message } = request.body as any;
      await NotificationService.logAndNotifyMention(commentId, taskId, phone, message);
      return reply.status(200).send({ success: true });
    }
  );
}
