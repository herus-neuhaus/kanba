import { FastifyInstance } from 'fastify';
import z from 'zod';
import { db } from '../../db';
import { projectPermissions, agencyMembers, projects } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '../middlewares/auth';

export async function projectPermissionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // Helper to check if user can manage roles
  function canManageRoles(userContext: any): boolean {
    const { role, agencyRole } = userContext;
    if (role === 'owner' || role === 'manager') return true;
    if (agencyRole?.permissions?.manage_roles) return true;
    return false;
  }

  // GET /project-permissions
  app.get(
    '/project-permissions',
    {
      schema: {
        querystring: z.object({
          profileId: z.string().uuid().optional(),
          projectId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { profileId, projectId } = request.query as any;
      const { activeAgency } = (request as any).userContext;

      if (!profileId && !projectId) return reply.send([]);

      if (profileId) {
        // Security check: make sure the profile belongs to the active agency
        const [member] = await db
          .select()
          .from(agencyMembers)
          .where(
            and(
              eq(agencyMembers.userId, profileId),
              eq(agencyMembers.agencyId, activeAgency.id)
            )
          );

        if (!member) {
          return reply.status(403).send({ message: 'Profile not found in active agency' });
        }

        const permissions = await db
          .select()
          .from(projectPermissions)
          .where(eq(projectPermissions.profileId, profileId));

        return reply.send(permissions.map(p => ({
          id: p.id,
          profile_id: p.profileId,
          project_id: p.projectId,
          permission_level: p.permissionLevel,
          created_at: p.createdAt
        })));
      }

      if (projectId) {
        // Security check for project
        const [project] = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, projectId),
              eq(projects.agencyId, activeAgency.id)
            )
          );

        if (!project) return reply.status(403).send({ message: 'Project not found in active agency' });

        const permissions = await db
          .select()
          .from(projectPermissions)
          .where(eq(projectPermissions.projectId, projectId));

        return reply.send(permissions.map(p => ({
          id: p.id,
          profile_id: p.profileId,
          project_id: p.projectId,
          permission_level: p.permissionLevel,
          created_at: p.createdAt
        })));
      }
    }
  );

  // PUT /project-permissions
  app.put(
    '/project-permissions',
    {
      schema: {
        body: z.object({
          profile_id: z.string().uuid(),
          project_id: z.string().uuid(),
          permission_level: z.enum(['view', 'edit']).nullable(),
        }),
      },
    },
    async (request, reply) => {
      const { profile_id, project_id, permission_level } = request.body as any;
      const userContext = (request as any).userContext;
      const { activeAgency } = userContext;

      if (!canManageRoles(userContext)) {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      // 1. Verify profile belongs to active agency
      const [member] = await db
        .select()
        .from(agencyMembers)
        .where(
          and(
            eq(agencyMembers.userId, profile_id),
            eq(agencyMembers.agencyId, activeAgency.id)
          )
        );

      if (!member) {
        return reply.status(404).send({ message: 'Profile not found in active agency' });
      }

      // 2. Verify project belongs to active agency
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, project_id),
            eq(projects.agencyId, activeAgency.id)
          )
        );

      if (!project) {
        return reply.status(404).send({ message: 'Project not found in active agency' });
      }

      // 3. Process the permission level
      if (permission_level === null) {
        await db
          .delete(projectPermissions)
          .where(
            and(
              eq(projectPermissions.profileId, profile_id),
              eq(projectPermissions.projectId, project_id)
            )
          );
        return reply.send({ success: true, message: 'Permission removed' });
      } else {
        // Upsert manual check
        const [existing] = await db
          .select()
          .from(projectPermissions)
          .where(
            and(
              eq(projectPermissions.profileId, profile_id),
              eq(projectPermissions.projectId, project_id)
            )
          );

        if (existing) {
          const [updated] = await db
            .update(projectPermissions)
            .set({ permissionLevel: permission_level })
            .where(eq(projectPermissions.id, existing.id))
            .returning();
          
          return reply.send({
            id: updated.id,
            profile_id: updated.profileId,
            project_id: updated.projectId,
            permission_level: updated.permissionLevel,
            created_at: updated.createdAt
          });
        } else {
          const [inserted] = await db
            .insert(projectPermissions)
            .values({
              profileId: profile_id,
              projectId: project_id,
              permissionLevel: permission_level
            })
            .returning();

          return reply.send({
            id: inserted.id,
            profile_id: inserted.profileId,
            project_id: inserted.projectId,
            permission_level: inserted.permissionLevel,
            created_at: inserted.createdAt
          });
        }
      }
    }
  );
}
