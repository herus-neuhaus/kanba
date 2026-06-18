import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../../services/auth.service';

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  let token = request.cookies['sb-access-token'];
  
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return reply.status(401).send({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Get agencyId from headers or cookies if frontend passes it, else fallback
    const agencyId = (request.headers['x-agency-id'] as string) || (request.query as any)?.agency_id;
    
    const context = await AuthService.resolveUserContext(token, agencyId);
    
    if (!context.activeAgency) {
      return reply.status(403).send({ message: 'Forbidden: No active agency found for user' });
    }

    // Attach context to request
    (request as any).userContext = context;
  } catch (error) {
    return reply.status(401).send({ message: error instanceof Error ? error.message : 'Unauthorized' });
  }
}

export async function verifyUserOnly(request: FastifyRequest, reply: FastifyReply) {
  let token = request.cookies['sb-access-token'];
  
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return reply.status(401).send({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Only resolve context, without enforcing any active agency match
    const context = await AuthService.resolveUserContext(token);
    
    (request as any).userContext = context;
  } catch (error) {
    return reply.status(401).send({ message: error instanceof Error ? error.message : 'Unauthorized' });
  }
}

export function checkRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const context = (request as any).userContext;
    if (!context || !context.role || !allowedRoles.includes(context.role)) {
      return reply.status(403).send({ message: 'Forbidden: Insufficient role permissions' });
    }
  };
}
