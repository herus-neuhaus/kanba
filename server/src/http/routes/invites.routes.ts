import { FastifyInstance } from 'fastify';
import z from 'zod';
import { randomUUID } from 'crypto';
import { db } from '../../db';
import { invites, agencies, agencyMembers, projectPermissions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, checkRole, verifyUserOnly } from '../middlewares/auth';
import { serializeInvite } from '../serializers';

export async function invitesRoutes(app: FastifyInstance) {
  
  // GET /invites/:token (Public - gets info about the invite)
  app.get(
    '/invites/:token',
    {
      schema: {
        params: z.object({
          token: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { token } = request.params as any;

      const [invite] = await db
        .select({
          id: invites.id,
          agencyId: invites.agencyId,
          role: invites.role,
          used: invites.used,
          agencyName: agencies.name,
        })
        .from(invites)
        .leftJoin(agencies, eq(invites.agencyId, agencies.id))
        .where(eq(invites.token, token));

      if (!invite) {
        return reply.status(404).send({ success: false, message: 'Convite inválido ou não encontrado' });
      }

      if (invite.used) {
        return reply.status(400).send({ success: false, message: 'Este convite já foi utilizado' });
      }

      return reply.send({
        success: true,
        agency_id: invite.agencyId,
        agency_name: invite.agencyName,
        role: invite.role,
      });
    }
  );

  // POST /invites/:token/accept
  app.post(
    '/invites/:token/accept',
    {
      preHandler: [verifyUserOnly], // Requer autenticação mas NÃO exige agência ativa
      schema: {
        params: z.object({
          token: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { token } = request.params as any;
      const { user } = (request as any).userContext;

      try {
        const result = await db.transaction(async (tx) => {
          // 1. Validar convite
          const [invite] = await tx
            .select()
            .from(invites)
            .where(eq(invites.token, token));

          if (!invite) throw new Error('Convite inválido');
          if (invite.used) throw new Error('Convite já utilizado');

          // 2. Verificar se usuário já é membro da agência
          const [existingMember] = await tx
            .select()
            .from(agencyMembers)
            .where(and(eq(agencyMembers.agencyId, invite.agencyId), eq(agencyMembers.userId, user.id)));

          if (existingMember && existingMember.status === 'active') {
            throw new Error('Você já faz parte desta agência');
          }

          // 3. Adicionar como membro
          if (existingMember) {
            // Se já existir inativo, reativa
            await tx
              .update(agencyMembers)
              .set({ status: 'active', role: invite.role || 'member', roleId: invite.roleId })
              .where(eq(agencyMembers.id, existingMember.id));
          } else {
            await tx.insert(agencyMembers).values({
              agencyId: invite.agencyId,
              userId: user.id,
              role: invite.role || 'member',
              roleId: invite.roleId,
              status: 'active',
            });
          }

          // 4. Adicionar permissão de projeto, se aplicável
          if (invite.projectId) {
            await tx.insert(projectPermissions).values({
              profileId: user.id,
              projectId: invite.projectId,
              permissionLevel: 'edit',
            });
          }

          // 5. Marcar convite como usado
          await tx
            .update(invites)
            .set({ used: true })
            .where(eq(invites.token, token));
            
          return { agencyId: invite.agencyId };
        });

        return reply.send({ success: true, message: 'Convite aceito com sucesso', agency_id: result.agencyId });
      } catch (error) {
        return reply.status(400).send({ success: false, message: error instanceof Error ? error.message : 'Erro ao aceitar convite' });
      }
    }
  );

  // POST /invites (Protected)
  app.post(
    '/invites',
    {
      preHandler: [verifyAuth, checkRole(['owner', 'manager'])],
      schema: {
        body: z.object({
          email: z.string().email().optional(),
          role: z.string().optional(),
          role_id: z.string().uuid().optional(),
          project_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const data = request.body as any;
      const { activeAgency } = (request as any).userContext;

      const [newInvite] = await db
        .insert(invites)
        .values({
          agencyId: activeAgency.id,
          token: randomUUID(),
          email: data.email,
          role: data.role,
          roleId: data.role_id,
          projectId: data.project_id,
        })
        .returning();

      return reply.status(201).send(serializeInvite(newInvite));
    }
  );

  // DELETE /invites/:id (Protected)
  app.delete(
    '/invites/:id',
    {
      preHandler: [verifyAuth, checkRole(['owner', 'manager'])],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { activeAgency } = (request as any).userContext;

      // Ensure invite belongs to agency
      const [invite] = await db
        .select()
        .from(invites)
        .where(and(eq(invites.id, id), eq(invites.agencyId, activeAgency.id)));

      if (!invite) return reply.status(404).send({ message: 'Invite not found' });

      await db.delete(invites).where(eq(invites.id, id));
      return reply.send({ message: 'Invite deleted' });
    }
  );

  // GET /invites (List invites for active agency)
  app.get(
    '/invites',
    {
      preHandler: [verifyAuth],
    },
    async (request, reply) => {
      const { activeAgency } = (request as any).userContext;

      const allInvites = await db
        .select()
        .from(invites)
        .where(and(eq(invites.agencyId, activeAgency.id), eq(invites.used, false)))
        .orderBy(invites.createdAt);

      return reply.send(allInvites.map(serializeInvite));
    }
  );
}
