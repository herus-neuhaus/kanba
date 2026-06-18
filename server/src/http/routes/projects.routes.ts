import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { projects, tasks, comments, kanbanColumns, projectPermissions } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyAuth, checkRole } from '../middlewares/auth';
import { canEditProject } from '../permissions';

import { serializeProject } from '../serializers';

export async function projectsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // GET /projects
  app.get(
    '/projects',
    {
      schema: {
        querystring: z.object({
          spaceId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { spaceId } = request.query as any;
      const { activeAgency, user, role } = (request as any).userContext;

      let projectIdsAllowed: string[] | null = null;

      // If user is not manager/owner, filter by project_permissions
      if (role !== 'manager' && role !== 'owner') {
        const permissions = await db
          .select({ projectId: projectPermissions.projectId })
          .from(projectPermissions)
          .where(eq(projectPermissions.profileId, user.id));
        
        projectIdsAllowed = permissions.map(p => p.projectId);
        
        // Se não for admin e não tiver permissões, não vê nada
        if (projectIdsAllowed.length === 0) {
          return reply.send([]);
        }
      }

      // Base query condition
      const conditions = [eq(projects.agencyId, activeAgency.id)];
      
      if (spaceId) {
        conditions.push(eq(projects.spaceId, spaceId));
      }

      if (projectIdsAllowed) {
        conditions.push(inArray(projects.id, projectIdsAllowed));
      }

      const allProjects = await db
        .select()
        .from(projects)
        .where(and(...conditions))
        .orderBy(projects.createdAt);

      return reply.send(allProjects.map(serializeProject));
    }
  );

  // POST /projects
  app.post(
    '/projects',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          space_id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { name, description, space_id } = request.body as any;
      const { activeAgency } = (request as any).userContext;

      // Verify if space exists and belongs to agency
      // In a real scenario we'd do a quick check, but Drizzle foreign keys handle it.

      const [newProject] = await db
        .insert(projects)
        .values({
          name,
          description,
          spaceId: space_id,
          agencyId: activeAgency.id,
        })
        .returning();

      return reply.status(201).send(serializeProject(newProject));
    }
  );

  // PATCH /projects/:id
  app.patch(
    '/projects/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { name, description } = request.body as any;
      const userContext = (request as any).userContext;
      const { activeAgency, role, user } = userContext;

      const hasAccess = await canEditProject(id, userContext);
      if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });

      const [updatedProject] = await db
        .update(projects)
        .set({ name, description })
        .where(
          and(
            eq(projects.id, id),
            eq(projects.agencyId, activeAgency.id)
          )
        )
        .returning();

      if (!updatedProject) {
        return reply.status(404).send({ message: 'Project not found' });
      }

      return reply.send(serializeProject(updatedProject));
    }
  );

  // DELETE /projects/:id
  app.delete(
    '/projects/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { activeAgency } = (request as any).userContext;

      try {
        await db.transaction(async (tx) => {
          // 1. Validar projeto existe na agência
          const [project] = await tx
            .select()
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.agencyId, activeAgency.id)));

          if (!project) {
            throw new Error('Project not found');
          }

          // 2. Buscar tasks do projeto
          const projectTasks = await tx
            .select({ id: tasks.id })
            .from(tasks)
            .where(eq(tasks.projectId, id));

          const taskIds = projectTasks.map(t => t.id);

          // 3. Deletar comentários das tasks
          if (taskIds.length > 0) {
            await tx.delete(comments).where(inArray(comments.taskId, taskIds));
            
            // 4. Deletar tasks
            await tx.delete(tasks).where(inArray(tasks.id, taskIds));
          }

          // 5. Deletar permissões do projeto
          await tx.delete(projectPermissions).where(eq(projectPermissions.projectId, id));

          // 6. Deletar colunas
          await tx.delete(kanbanColumns).where(eq(kanbanColumns.projectId, id));

          // 7. Deletar projeto
          await tx.delete(projects).where(eq(projects.id, id));
        });

        return reply.send({ message: 'Project and all related data deleted successfully' });
      } catch (error) {
        if (error instanceof Error && error.message === 'Project not found') {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );
}
