import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { agencyMembers, profiles } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuth, checkRole } from '../middlewares/auth';

export async function teamRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // GET /team
  app.get('/team', async (request, reply) => {
    const { activeAgency } = (request as any).userContext;

    const members = await db
      .select({
        member: agencyMembers,
        user: profiles
      })
      .from(agencyMembers)
      .innerJoin(profiles, eq(agencyMembers.userId, profiles.id))
      .where(eq(agencyMembers.agencyId, activeAgency.id));

    const mappedMembers = members.map(m => ({
      id: m.user.id,
      member_id: m.member.id,
      agency_id: m.member.agencyId,
      role_id: m.member.roleId,
      role: m.member.role,
      status: m.member.status,
      full_name: m.user.fullName,
      phone: m.user.phone,
      avatar_url: m.user.avatarUrl,
      email: m.user.email
    }));

    return reply.send(mappedMembers);
  });

  // PATCH /team/:userId/status
  app.patch(
    '/team/:userId/status',
    {
      schema: {
        params: z.object({ userId: z.string().uuid() }),
        body: z.object({ status: z.string() })
      },
      preHandler: [checkRole(['owner', 'manager'])]
    },
    async (request, reply) => {
      const { userId } = request.params as any;
      const { status } = request.body as any;
      const { activeAgency } = (request as any).userContext;

      // Prevent user from deactivating themselves if they are the only owner
      if (status === 'inactive') {
        const activeOwnersCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(agencyMembers)
          .where(
            and(
              eq(agencyMembers.agencyId, activeAgency.id),
              eq(agencyMembers.role, 'owner'),
              eq(agencyMembers.status, 'active')
            )
          );
        
        const [targetMember] = await db
          .select()
          .from(agencyMembers)
          .where(
            and(
              eq(agencyMembers.agencyId, activeAgency.id),
              eq(agencyMembers.userId, userId)
            )
          );

        if (targetMember?.role === 'owner' && activeOwnersCount[0].count <= 1) {
          return reply.status(400).send({ message: 'Cannot deactivate the only active owner.' });
        }
      }

      await db
        .update(agencyMembers)
        .set({ status })
        .where(
          and(
            eq(agencyMembers.agencyId, activeAgency.id),
            eq(agencyMembers.userId, userId)
          )
        );

      return reply.send({ message: 'Status updated' });
    }
  );

  // DELETE /team/:userId
  app.delete(
    '/team/:userId',
    {
      schema: {
        params: z.object({ userId: z.string().uuid() })
      },
      preHandler: [checkRole(['owner', 'manager'])]
    },
    async (request, reply) => {
      const { userId } = request.params as any;
      const { activeAgency } = (request as any).userContext;

      // Prevent deleting the last owner
      const ownersCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(agencyMembers)
        .where(
          and(
            eq(agencyMembers.agencyId, activeAgency.id),
            eq(agencyMembers.role, 'owner')
          )
        );

      const [targetMember] = await db
        .select()
        .from(agencyMembers)
        .where(
          and(
            eq(agencyMembers.agencyId, activeAgency.id),
            eq(agencyMembers.userId, userId)
          )
        );

      if (!targetMember) {
         return reply.status(404).send({ message: 'Member not found' });
      }

      if (targetMember.role === 'owner' && ownersCount[0].count <= 1) {
        return reply.status(400).send({ message: 'Cannot remove the last owner.' });
      }

      await db
        .delete(agencyMembers)
        .where(
          and(
            eq(agencyMembers.agencyId, activeAgency.id),
            eq(agencyMembers.userId, userId)
          )
        );

      return reply.send({ message: 'Member removed' });
    }
  );
}
