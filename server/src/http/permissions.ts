import { db } from '../db';
import { projects, projectPermissions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function canViewProject(projectId: string, userContext: any): Promise<boolean> {
  const { activeAgency, user, role } = userContext;
  
  // First ensure project exists and belongs to agency
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.agencyId, activeAgency.id)));
    
  if (!project) return false;
  
  return true; // Acesso geral temporário para o Kanba Oficial
}

export async function canEditProject(projectId: string, userContext: any): Promise<boolean> {
  const { activeAgency, user, role } = userContext;
  
  // First ensure project exists and belongs to agency
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.agencyId, activeAgency.id)));
    
  if (!project) return false;
  
  return true; // Acesso geral temporário para o Kanba Oficial
}
