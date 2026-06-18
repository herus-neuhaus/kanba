import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { tasks, comments, projects, projectPermissions, profiles } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyAuth } from '../middlewares/auth';

import { serializeTask, serializeComment } from '../serializers';
import { canViewProject, canEditProject } from '../permissions';

export async function tasksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // GET /tasks
  app.get(
    '/tasks',
    {
      schema: {
        querystring: z.object({
          projectId: z.string().uuid().optional(),
          spaceId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { projectId, spaceId } = request.query as any;
      const { activeAgency, role, user } = (request as any).userContext;

      let projectIdsAllowed: string[] | null = null;

      // Filter by permissions if not owner/manager
      if (role !== 'manager' && role !== 'owner') {
        const permissions = await db
          .select({ projectId: projectPermissions.projectId })
          .from(projectPermissions)
          .where(eq(projectPermissions.profileId, user.id));
          
        projectIdsAllowed = permissions.map(p => p.projectId);
        
        if (projectIdsAllowed.length === 0) {
          return reply.send([]);
        }
      }

      const conditions = [eq(tasks.agencyId, activeAgency.id)];

      if (projectId) {
        if (projectIdsAllowed && !projectIdsAllowed.includes(projectId)) {
          return reply.status(403).send({ message: 'Forbidden' });
        }
        conditions.push(eq(tasks.projectId, projectId));
      } else if (projectIdsAllowed) {
        conditions.push(inArray(tasks.projectId, projectIdsAllowed));
      }

      // If spaceId is provided, we need to join with projects to filter
      let query = db.select({ task: tasks, project: projects }).from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id));
      
      const results = await query.where(and(...conditions)).orderBy(tasks.createdAt);
      
      // Filter by spaceId manually if provided (or we could do it in SQL, but doing it in memory is fine for now)
      let finalTasks = results;
      if (spaceId) {
        finalTasks = results.filter(r => r.project?.spaceId === spaceId);
      }
      
      const mappedTasks = finalTasks.map(r => serializeTask({
        ...r.task,
        project: r.project
      }));

      return reply.send(mappedTasks);
    }
  );

  // POST /tasks
  app.post(
    '/tasks',
    {
      schema: {
        body: z.object({
          title: z.string().min(1),
          project_id: z.string().uuid().optional(),
          column_id: z.string().uuid().optional(),
          priority: z.string().optional(),
          description: z.string().optional(),
          assignee_ids: z.array(z.string().uuid()).optional(),
          due_date: z.string().optional(),
          labels: z.array(z.string()).optional(),
        }),
      },
    },
    async (request, reply) => {
      const data = request.body as any;
      const userContext = (request as any).userContext;

      if (data.project_id) {
        const hasAccess = await canEditProject(data.project_id, userContext);
        if (!hasAccess) return reply.status(403).send({ message: 'Forbidden: No access to project' });
      }

      const [newTask] = await db
        .insert(tasks)
        .values({
          title: data.title,
          projectId: data.project_id,
          columnId: data.column_id,
          priority: data.priority,
          description: data.description,
          assigneeIds: data.assignee_ids,
          dueDate: data.due_date ? new Date(data.due_date) : null,
          labels: data.labels,
          agencyId: userContext.activeAgency.id,
        })
        .returning();

      return reply.status(201).send(serializeTask(newTask));
    }
  );

  // GET /tasks/:id
  app.get(
    '/tasks/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const userContext = (request as any).userContext;

      // Verify task belongs to agency
      const [existingTask] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.agencyId, userContext.activeAgency.id)));
      if (!existingTask) return reply.status(404).send({ message: 'Task not found' });

      // Verify project access
      if (existingTask.projectId) {
        const hasAccess = await canViewProject(existingTask.projectId, userContext);
        if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });
      }

      return reply.send(serializeTask(existingTask));
    }
  );

  // PATCH /tasks/:id
  app.patch(
    '/tasks/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any;
      const userContext = (request as any).userContext;

      // Security: ensure task belongs to agency
      const [existingTask] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.agencyId, userContext.activeAgency.id)));
      if (!existingTask) return reply.status(404).send({ message: 'Task not found' });

      if (existingTask.projectId) {
        const hasAccess = await canEditProject(existingTask.projectId, userContext);
        if (!hasAccess) return reply.status(403).send({ message: 'Forbidden: No access to project' });
      }

      // Sanitization: Only allow updating safe fields
      const safeData: any = {};
      const allowedFields = ['title', 'description', 'priority', 'due_date', 'column_id', 'labels', 'assignee_ids', 'checklist'];
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          // Map to camelCase for Drizzle
          const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          if (field === 'due_date' && data[field]) {
            safeData[camelField] = new Date(data[field]);
          } else {
            safeData[camelField] = data[field];
          }
        }
      }

      const [updatedTask] = await db
        .update(tasks)
        .set(safeData)
        .where(eq(tasks.id, id))
        .returning();

      return reply.send(serializeTask(updatedTask));
    }
  );

  // DELETE /tasks/:id
  app.delete(
    '/tasks/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const userContext = (request as any).userContext;

      // Get task to check project access
      const [existingTask] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.agencyId, userContext.activeAgency.id)));
      if (!existingTask) return reply.status(404).send({ message: 'Task not found' });

      if (existingTask.projectId) {
        const hasAccess = await canEditProject(existingTask.projectId, userContext);
        if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });
      }

      // Transactional delete
      await db.transaction(async (tx) => {
        await tx.delete(comments).where(eq(comments.taskId, id));
        await tx.delete(tasks).where(eq(tasks.id, id));
      });

      return reply.send({ message: 'Task deleted' });
    }
  );

  // GET /tasks/:id/comments
  app.get(
    '/tasks/:id/comments',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const userContext = (request as any).userContext;

      const [existingTask] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.agencyId, userContext.activeAgency.id)));
      if (!existingTask) return reply.status(404).send({ message: 'Task not found' });

      if (existingTask.projectId) {
        const hasAccess = await canEditProject(existingTask.projectId, userContext);
        if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });
      }

      const taskComments = await db
        .select({
          comment: comments,
          user: profiles,
        })
        .from(comments)
        .leftJoin(profiles, eq(comments.userId, profiles.id))
        .where(eq(comments.taskId, id))
        .orderBy(comments.createdAt);

      return reply.send(taskComments.map(r => serializeComment({
        ...r.comment,
        user: r.user
      })));
    }
  );

  // POST /tasks/:id/comments
  app.post(
    '/tasks/:id/comments',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          text: z.string().min(1),
          authorName: z.string().optional(),
          projectName: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { text, authorName, projectName } = request.body as any;
      const userContext = (request as any).userContext;

      const [existingTask] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.agencyId, userContext.activeAgency.id)));
      if (!existingTask) return reply.status(404).send({ message: 'Task not found' });

      if (existingTask.projectId) {
        const hasAccess = await canEditProject(existingTask.projectId, userContext);
        if (!hasAccess) return reply.status(403).send({ message: 'Forbidden' });
      }

      const [newComment] = await db
        .insert(comments)
        .values({
          taskId: id,
          userId: userContext.user.id, // backend trust
          text,
        })
        .returning();

      // TODO: Extension point for WhatsApp notification via Cakto/Evolution

      return reply.status(201).send(serializeComment(newComment));
    }
  );

  // DELETE /comments/:id
  app.delete(
    '/comments/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const userContext = (request as any).userContext;

      const [existingResult] = await db
        .select({ comment: comments, task: tasks })
        .from(comments)
        .innerJoin(tasks, eq(comments.taskId, tasks.id))
        .where(
          and(
            eq(comments.id, id),
            eq(tasks.agencyId, userContext.activeAgency.id)
          )
        );

      if (!existingResult) return reply.status(404).send({ message: 'Comment not found' });

      // Check if user is author or has manager/owner role
      if (existingResult.comment.userId !== userContext.user.id && userContext.role !== 'owner' && userContext.role !== 'manager') {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      await db.delete(comments).where(eq(comments.id, id));
      return reply.send({ message: 'Comment deleted' });
    }
  );
}
