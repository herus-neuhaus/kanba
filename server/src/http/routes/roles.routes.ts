import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { agencyRoles } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '../middlewares/auth';

export async function rolesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  app.get('/roles', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;

    const roles = await db.select().from(agencyRoles).where(eq(agencyRoles.agencyId, activeAgency.id)).orderBy(agencyRoles.createdAt);
    return reply.status(200).send(roles);
  });

  app.post('/roles', {
    schema: {
      body: z.object({
        name: z.string(),
        permissions: z.any().optional(),
        role_type: z.enum(['internal', 'client']).optional().default('internal')
      })
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { name, permissions, role_type } = request.body as any;

    const [role] = await db.insert(agencyRoles).values({
      agencyId: activeAgency.id,
      name,
      permissions: permissions || {},
      roleType: role_type
    }).returning();

    return reply.status(201).send(role);
  });

  app.patch('/roles/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().optional(),
        permissions: z.any().optional()
      })
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;
    const { name, permissions } = request.body as any;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;

    const [role] = await db.update(agencyRoles)
      .set(updateData)
      .where(and(eq(agencyRoles.id, id), eq(agencyRoles.agencyId, activeAgency.id)))
      .returning();

    return reply.status(200).send(role);
  });

  app.delete('/roles/:id', {
    schema: { params: z.object({ id: z.string().uuid() }) }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;

    await db.delete(agencyRoles).where(and(eq(agencyRoles.id, id), eq(agencyRoles.agencyId, activeAgency.id)));

    return reply.status(204).send();
  });
}
