import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { agencies, agencyMembers, profiles, spaces, tasks, projects, kanbanColumns } from '../../db/schema';
import { verifyUserOnly } from '../middlewares/auth';
import { eq } from 'drizzle-orm';

export async function agenciesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyUserOnly);

  // POST /agencies
  app.post(
    '/agencies',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const { name } = request.body as any;
      const { user } = (request as any).userContext;

      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      // Check if profile exists, if not this means we have a desync, but typically supabase auth triggers insert profile.
      // We will assume profile exists or we just update what is possible.
      
      const result = await db.transaction(async (tx) => {
        // 1. Create agency
        const [newAgency] = await tx
          .insert(agencies)
          .values({
            name,
            ownerUserId: user.id,
            planType: 'profissional',
            subscriptionStatus: 'trialing',
          })
          .returning();

        // 2. Create membership
        await tx
          .insert(agencyMembers)
          .values({
            agencyId: newAgency.id,
            userId: user.id,
            role: 'owner',
            status: 'active',
          });

        // 3. Update profile
        await tx
          .update(profiles)
          .set({ onboardingCompleted: true })
          .where(eq(profiles.id, user.id));

        // 4. Create default workspace (space)
        await tx
          .insert(spaces)
          .values({
            agencyId: newAgency.id,
            name: 'Geral',
            color: 'bg-blue-500',
          });

        return newAgency;
      });

      // Map back to snake_case for frontend
      return reply.status(201).send({
        id: result.id,
        name: result.name,
        owner_user_id: result.ownerUserId,
        created_at: result.createdAt,
        demand_types: result.demandTypes,
        evolution_instance_name: result.evolutionInstanceName,
        whatsapp_connected: result.whatsappConnected,
        whatsapp_number: result.whatsappNumber,
        plan_type: result.planType,
        subscription_status: result.subscriptionStatus,
        last_payment_at: result.lastPaymentAt,
        next_billing_date: result.nextBillingDate,
        cakto_id: result.caktoId,
        updated_at: result.updatedAt,
        ai_active: result.aiActive,
      });
    }
  );

  // PATCH /agencies/current
  app.patch(
    '/agencies/current',
    {
      schema: {
        body: z.object({
          name: z.string().optional(),
          demand_types: z.array(z.string()).optional(),
        }),
      },
    },
    async (request, reply) => {
      const { name, demand_types } = request.body as any;
      const { activeAgency, role } = (request as any).userContext;

      if (role !== 'owner' && role !== 'manager') {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (demand_types !== undefined) updates.demandTypes = demand_types;

      await db
        .update(agencies)
        .set(updates)
        .where(eq(agencies.id, activeAgency.id));

      return reply.send({ message: 'Agency updated' });
    }
  );

  // PATCH /agencies/current/demand-types
  app.patch(
    '/agencies/current/demand-types',
    {
      schema: {
        body: z.object({
          demand_types: z.array(z.string()),
        }),
      },
    },
    async (request, reply) => {
      const { demand_types } = request.body as any;
      const { activeAgency, role } = (request as any).userContext;

      if (role !== 'owner' && role !== 'manager') {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      await db
        .update(agencies)
        .set({ demandTypes: demand_types })
        .where(eq(agencies.id, activeAgency.id));

      return reply.send({ message: 'Demand types updated' });
    }
  );

  // PATCH /agencies/current/ai-active
  app.patch(
    '/agencies/current/ai-active',
    {
      schema: {
        body: z.object({
          ai_active: z.boolean(),
        }),
      },
    },
    async (request, reply) => {
      const { ai_active } = request.body as any;
      const { activeAgency, role } = (request as any).userContext;

      if (role !== 'owner' && role !== 'manager') {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      await db
        .update(agencies)
        .set({ aiActive: ai_active })
        .where(eq(agencies.id, activeAgency.id));

      return reply.send({ message: 'AI Active updated' });
    }
  );

  // GET /agencies/current/stats
  app.get('/agencies/current/stats', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;

    const [tasksData, profilesData, projectsData] = await Promise.all([
      db
        .select({
          task: tasks,
          project: projects,
          column: kanbanColumns,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
        .where(eq(tasks.agencyId, activeAgency.id)),
      db.select().from(profiles).where(eq(profiles.agencyId, activeAgency.id)),
      db.select().from(projects).where(eq(projects.agencyId, activeAgency.id)),
    ]);

    const mappedTasks = tasksData.map((t) => ({
      ...t.task,
      project: t.project,
      column: t.column,
    }));

    return reply.send({
      tasks: mappedTasks,
      profiles: profilesData,
      projects: projectsData,
    });
  });
}
