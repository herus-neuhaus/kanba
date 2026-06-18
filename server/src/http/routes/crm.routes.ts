import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { crmPipelines, crmClients, crmDeals, profiles, enterpriseLeads } from '../../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { verifyAuth, checkRole } from '../middlewares/auth';

export async function crmRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // --- Pipelines ---
  
  app.get('/crm/pipelines', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { spaceId } = request.query as any;

    let query = db.select().from(crmPipelines).where(eq(crmPipelines.agencyId, activeAgency.id));
    if (spaceId) {
      query = db.select().from(crmPipelines).where(and(eq(crmPipelines.agencyId, activeAgency.id), eq(crmPipelines.spaceId, spaceId)));
    }

    const pipelines = await query.orderBy(desc(crmPipelines.createdAt));
    return reply.status(200).send(pipelines);
  });

  app.post('/crm/pipelines', {
    schema: {
      body: z.object({
        name: z.string(),
        description: z.string().optional(),
        spaceId: z.string().uuid(),
      })
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { name, description, spaceId } = request.body as any;

    const [pipeline] = await db.insert(crmPipelines).values({
      agencyId: activeAgency.id,
      name,
      description,
      spaceId,
    }).returning();

    return reply.status(201).send(pipeline);
  });

  app.patch('/crm/pipelines/:id', {
    schema: {
      body: z.object({ name: z.string() }),
      params: z.object({ id: z.string().uuid() }),
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;
    const { name } = request.body as any;

    const [pipeline] = await db.update(crmPipelines)
      .set({ name })
      .where(and(eq(crmPipelines.id, id), eq(crmPipelines.agencyId, activeAgency.id)))
      .returning();

    return reply.status(200).send(pipeline);
  });

  app.delete('/crm/pipelines/:id', {
    schema: { params: z.object({ id: z.string().uuid() }) }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;

    await db.transaction(async (tx) => {
      await tx.delete(crmDeals).where(eq(crmDeals.pipelineId, id));
      await tx.delete(crmPipelines).where(and(eq(crmPipelines.id, id), eq(crmPipelines.agencyId, activeAgency.id)));
    });

    return reply.status(204).send();
  });

  // --- Clients ---

  app.get('/crm/clients', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { spaceId } = request.query as any;

    let query = db.select().from(crmClients).where(eq(crmClients.agencyId, activeAgency.id));
    if (spaceId) {
      query = db.select().from(crmClients).where(and(eq(crmClients.agencyId, activeAgency.id), eq(crmClients.spaceId, spaceId)));
    }

    const clients = await query.orderBy(crmClients.name);
    return reply.status(200).send(clients);
  });

  app.post('/crm/clients', {
    schema: {
      body: z.object({
        name: z.string(),
        status: z.string().optional(),
        contactInfo: z.any().optional(),
        spaceId: z.string().uuid(),
      })
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { name, status, contactInfo, spaceId } = request.body as any;

    const [client] = await db.insert(crmClients).values({
      agencyId: activeAgency.id,
      name,
      status,
      contactInfo: contactInfo || {},
      spaceId,
    }).returning();

    return reply.status(201).send(client);
  });

  app.patch('/crm/clients/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.any() // Using any for partial updates just as an example
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;
    const payload = request.body as any;

    const [client] = await db.update(crmClients)
      .set(payload)
      .where(and(eq(crmClients.id, id), eq(crmClients.agencyId, activeAgency.id)))
      .returning();

    return reply.status(200).send(client);
  });

  // --- Deals ---

  app.get('/crm/deals', {
    schema: { querystring: z.object({ pipelineId: z.string().uuid() }) }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { pipelineId } = request.query as any;

    // We need to fetch deals, clients, and assignees
    const rows = await db
      .select({
        deal: crmDeals,
        client: crmClients,
        assignee: profiles
      })
      .from(crmDeals)
      .leftJoin(crmClients, eq(crmDeals.clientId, crmClients.id))
      .leftJoin(profiles, eq(crmDeals.assignedTo, profiles.id))
      .where(and(eq(crmDeals.agencyId, activeAgency.id), eq(crmDeals.pipelineId, pipelineId)))
      .orderBy(desc(crmDeals.createdAt));

    // Map to nested structure
    const results = rows.map(r => ({
      ...r.deal,
      client: r.client,
      assignee: r.assignee
    }));

    return reply.status(200).send(results);
  });

  app.post('/crm/deals', {
    schema: {
      body: z.object({
        pipeline_id: z.string().uuid(),
        client_id: z.string().uuid(),
        title: z.string(),
        value: z.number().optional().default(0),
        stage: z.string(),
        expected_close_date: z.string().optional().nullable(),
        assigned_to: z.string().uuid().optional().nullable(),
      })
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { pipeline_id, client_id, title, value, stage, expected_close_date, assigned_to } = request.body as any;

    const [pipe] = await db.select({ spaceId: crmPipelines.spaceId }).from(crmPipelines).where(eq(crmPipelines.id, pipeline_id));

    const [deal] = await db.insert(crmDeals).values({
      agencyId: activeAgency.id,
      pipelineId: pipeline_id,
      clientId: client_id,
      title,
      value: value.toString(),
      stage,
      expectedCloseDate: expected_close_date ? new Date(expected_close_date) : null,
      assignedTo: assigned_to || null,
      spaceId: pipe?.spaceId || null,
    }).returning();

    return reply.status(201).send(deal);
  });

  app.patch('/crm/deals/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.any()
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;
    const payload = request.body as any;

    // Convert keys from snake_case to camelCase mapping for drizzle if necessary
    // But since the frontend uses snake_case, we handle mapping manually
    const updateData: any = {};
    if (payload.stage !== undefined) updateData.stage = payload.stage;
    if (payload.assigned_to !== undefined) updateData.assignedTo = payload.assigned_to;
    if (payload.next_action_date !== undefined) updateData.nextActionDate = payload.next_action_date ? new Date(payload.next_action_date) : null;
    if (payload.next_action_label !== undefined) updateData.nextActionLabel = payload.next_action_label;
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.value !== undefined) updateData.value = payload.value.toString();
    if (payload.expected_close_date !== undefined) updateData.expectedCloseDate = payload.expected_close_date ? new Date(payload.expected_close_date) : null;

    const [deal] = await db.update(crmDeals)
      .set(updateData)
      .where(and(eq(crmDeals.id, id), eq(crmDeals.agencyId, activeAgency.id)))
      .returning();

    return reply.status(200).send(deal);
  });

  app.delete('/crm/deals/:id', {
    schema: { params: z.object({ id: z.string().uuid() }) }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { id } = request.params as any;

    await db.delete(crmDeals).where(and(eq(crmDeals.id, id), eq(crmDeals.agencyId, activeAgency.id)));

    return reply.status(204).send();
  });

  // --- Enterprise Leads ---
  app.post('/crm/enterprise-leads', {
    schema: {
      body: z.object({
        name: z.string(),
        email: z.string().email(),
        whatsapp: z.string(),
        teamSize: z.string(),
        agencyId: z.string().uuid().optional().nullable(),
      })
    }
  }, async (request, reply) => {
    const { name, email, whatsapp, teamSize, agencyId } = request.body as any;

    await db.insert(enterpriseLeads).values({
      name,
      email,
      whatsapp,
      teamSize,
      agencyId: agencyId || null,
    });

    return reply.status(201).send({ success: true });
  });
}
