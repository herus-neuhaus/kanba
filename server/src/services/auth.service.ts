import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { profiles, agencyMembers, agencies, agencyRoles } from '../db/schema';
import { supabaseAuthClient } from '../lib/supabase';

export class AuthService {
  /**
   * Valida o JWT do Supabase e retorna os metadados do usuário e permissões da agência atual
   */
  static async resolveUserContext(accessToken: string, requestedAgencyId?: string) {
    // 1. Validar token no Supabase Auth
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(accessToken);
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    // 2. Buscar o profile do usuário no banco usando Drizzle
    let profile;
    try {
      const result = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
      profile = result[0];
    } catch (e) {
      console.error("Database query failed for profile:", e);
      throw e;
    }

    if (!profile) {
      return { user, profile: null, activeAgency: null, role: null };
    }

    // 3. Buscar os memberships ativos do usuário
    const members = await db
      .select({
        memberId: agencyMembers.id,
        agencyId: agencyMembers.agencyId,
        role: agencyMembers.role,
        roleId: agencyMembers.roleId,
        status: agencyMembers.status,
      })
      .from(agencyMembers)
      .where(
        and(
          eq(agencyMembers.userId, user.id),
          eq(agencyMembers.status, 'active')
        )
      );

    if (members.length === 0) {
      return { user, profile, activeAgency: null, role: null };
    }

    // 4. Determinar a agência ativa (Segurança: Não confia 100% no reqAgencyId, verifica se o usuário é membro ativo)
    let activeMembership = members[0]; // Fallback para a primeira agência
    
    if (requestedAgencyId) {
      const requestedMembership = members.find(m => m.agencyId === requestedAgencyId);
      if (requestedMembership) {
        activeMembership = requestedMembership;
      } else {
        throw new Error('User does not have access to the requested agency');
      }
    }

    // 5. Buscar os detalhes da agência ativa e o cargo (role permissions)
    const [activeAgency] = await db.select().from(agencies).where(eq(agencies.id, activeMembership.agencyId)).limit(1);
    
    let rolePermissions = null;
    if (activeMembership.roleId) {
      const [roleData] = await db.select().from(agencyRoles).where(eq(agencyRoles.id, activeMembership.roleId)).limit(1);
      rolePermissions = roleData ?? null;
    }

    return {
      user,
      profile,
      activeAgency: activeAgency ?? null,
      role: activeMembership.role,
      rolePermissions
    };
  }
}
