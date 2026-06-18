import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { spaces } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, checkRole } from '../middlewares/auth';

import { serializeSpace } from '../serializers';

export async function spacesRoutes(app: FastifyInstance) {
  // Configura todas as rotas deste arquivo para requererem autenticação
  app.addHook('preHandler', verifyAuth);

  // GET /spaces
  app.get('/spaces', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;

    const allSpaces = await db
      .select()
      .from(spaces)
      .where(eq(spaces.agencyId, activeAgency.id))
      .orderBy(spaces.createdAt);

    return reply.send(allSpaces.map(serializeSpace));
  });

  // POST /spaces
  app.post(
    '/spaces',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          color: z.string().optional(),
          avatar_url: z.string().optional(),
        }),
      },
      // Middleware adicional para verificar se é manager/owner (opcional, ajustando com a regra de negócios atual que costuma permitir)
    },
    async (request, reply) => {
      const { name, color, avatar_url } = request.body as any;
      const { activeAgency } = (request as any).userContext;

      const [newSpace] = await db
        .insert(spaces)
        .values({
          name,
          color,
          avatarUrl: avatar_url,
          agencyId: activeAgency.id,
        })
        .returning();

      return reply.status(201).send(serializeSpace(newSpace));
    }
  );

  // PATCH /spaces/:id
  app.patch(
    '/spaces/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          color: z.string().optional(),
          avatar_url: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { name, color, avatar_url } = request.body as any;
      const { activeAgency } = (request as any).userContext;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (color !== undefined) updates.color = color;
      if (avatar_url !== undefined) updates.avatarUrl = avatar_url;

      const [updatedSpace] = await db
        .update(spaces)
        .set(updates)
        .where(
          and(
            eq(spaces.id, id),
            eq(spaces.agencyId, activeAgency.id) // Security: ensure space belongs to user's agency
          )
        )
        .returning();

      if (!updatedSpace) {
        return reply.status(404).send({ message: 'Space not found' });
      }

      return reply.send(serializeSpace(updatedSpace));
    }
  );

  // DELETE /spaces/:id
  app.delete(
    '/spaces/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
      preHandler: [checkRole(['owner', 'admin', 'manager'])], // Restringe deleção apenas a cargos altos, se desejado
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { activeAgency } = (request as any).userContext;

      const [deletedSpace] = await db
        .delete(spaces)
        .where(
          and(
            eq(spaces.id, id),
            eq(spaces.agencyId, activeAgency.id)
          )
        )
        .returning();

      if (!deletedSpace) {
        return reply.status(404).send({ message: 'Space not found' });
      }

      return reply.send({ message: 'Space deleted successfully' });
    }
  );
}
