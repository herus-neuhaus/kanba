import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { projectWikis, projects } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '../middlewares/auth';

export async function wikiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  app.get('/wiki', {
    schema: { querystring: z.object({ spaceId: z.string().uuid() }) }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { spaceId } = request.query as any;

    // TODO: Verify if space belongs to agency
    const [wiki] = await db.select().from(projectWikis).where(and(eq(projectWikis.spaceId, spaceId), eq(projectWikis.agencyId, activeAgency.id)));
    return reply.status(200).send(wiki || null);
  });

  app.put('/wiki', {
    schema: {
      body: z.object({
        spaceId: z.string().uuid(),
        content: z.any()
      })
    }
  }, async (request, reply) => {
    const { activeAgency } = (request as any).userContext;
    const { spaceId, content } = request.body as any;

    // TODO: Verify if space belongs to agency

    const [existingWiki] = await db.select().from(projectWikis).where(and(eq(projectWikis.spaceId, spaceId), eq(projectWikis.agencyId, activeAgency.id)));

    let updated;
    if (existingWiki) {
      [updated] = await db.update(projectWikis)
        .set({ content, updatedAt: new Date() })
        .where(eq(projectWikis.id, existingWiki.id))
        .returning();
    } else {
      [updated] = await db.insert(projectWikis)
        .values({ spaceId, agencyId: activeAgency.id, content })
        .returning();
    }

    return reply.status(200).send(updated);
  });
}
