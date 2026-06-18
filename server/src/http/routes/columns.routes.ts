import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { kanbanColumns, projects, projectPermissions, tasks } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '../middlewares/auth';
import { serializeColumn } from '../serializers';
import { canViewProject, canEditProject } from '../permissions';

export async function columnsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // GET /projects/:projectId/columns
  app.get(
    '/projects/:projectId/columns',
    {
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as any;
      const userContext = (request as any).userContext;

      const hasAccess = await canViewProject(projectId, userContext);
      if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });

      const columns = await db
        .select()
        .from(kanbanColumns)
        .where(eq(kanbanColumns.projectId, projectId))
        .orderBy(kanbanColumns.orderIndex);

      return reply.send(columns.map(serializeColumn));
    }
  );

  // POST /projects/:projectId/columns
  app.post(
    '/projects/:projectId/columns',
    {
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
        body: z.object({
          title: z.string().min(1),
          order_index: z.number().int(),
          color: z.string(),
          is_done: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as any;
      const { title, order_index, color, is_done } = request.body as any;
      const userContext = (request as any).userContext;

      const hasAccess = await canEditProject(projectId, userContext);
      if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });

      const [newCol] = await db
        .insert(kanbanColumns)
        .values({
          projectId,
          title,
          orderIndex: order_index,
          color,
          isDone: is_done ?? false,
        })
        .returning();

      return reply.status(201).send(serializeColumn(newCol));
    }
  );

  // PATCH /columns/:id
  app.patch(
    '/columns/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          title: z.string().optional(),
          order_index: z.number().int().optional(),
          color: z.string().optional(),
          is_done: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any;
      const userContext = (request as any).userContext;

      const [col] = await db.select().from(kanbanColumns).where(eq(kanbanColumns.id, id));
      if (!col) return reply.status(404).send({ message: 'Column not found' });

      const hasAccess = await canEditProject(col.projectId, userContext);
      if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });

      const safeData: any = {};
      if (data.title !== undefined) safeData.title = data.title;
      if (data.order_index !== undefined) safeData.orderIndex = data.order_index;
      if (data.color !== undefined) safeData.color = data.color;
      if (data.is_done !== undefined) safeData.isDone = data.is_done;

      const [updatedCol] = await db
        .update(kanbanColumns)
        .set(safeData)
        .where(eq(kanbanColumns.id, id))
        .returning();

      return reply.send(serializeColumn(updatedCol));
    }
  );

  // DELETE /columns/:id
  app.delete(
    '/columns/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const userContext = (request as any).userContext;

      const [col] = await db.select().from(kanbanColumns).where(eq(kanbanColumns.id, id));
      if (!col) return reply.status(404).send({ message: 'Column not found' });

      const hasAccess = await canEditProject(col.projectId, userContext);
      if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });

      await db.transaction(async (tx) => {
        // Prevent orphaned tasks or set them to null. Drizzle might not cascade automatically depending on schema definitions.
        await tx.update(tasks).set({ columnId: null }).where(eq(tasks.columnId, id));
        await tx.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
      });

      return reply.send({ message: 'Column deleted' });
    }
  );
}
