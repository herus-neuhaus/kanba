import { FastifyInstance } from 'fastify';
import { verifyAuth, checkRole } from '../middlewares/auth';
import { supabaseAuthClient } from '../../lib/supabase';

export async function aiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyAuth);

  // POST /ai/monitor
  app.post(
    '/ai/monitor',
    {
      preHandler: [checkRole(['owner', 'manager'])],
    },
    async (request, reply) => {
      // Temporarily invoking the Edge Function from the backend using the service role / anon key
      // The Supabase client is configured with SUPABASE_URL and SUPABASE_ANON_KEY 
      // but if the function requires auth, we can pass the auth header from the original request 
      // or just call it if it doesn't need it. 
      // The original frontend code was `supabase.functions.invoke('kanba-ai-monitor', { method: 'POST' });`
      // So it relied on the user's JWT. We can pass the user's token forward.
      
      const authHeader = request.headers.authorization;
      
      // Setup fetch headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      try {
        const { error } = await supabaseAuthClient.functions.invoke('kanba-ai-monitor', {
          method: 'POST',
          headers,
        });

        if (error) {
          throw error;
        }

        return reply.send({ success: true });
      } catch (error: any) {
        return reply.status(500).send({ message: error.message || 'Error triggering AI monitor' });
      }
    }
  );
}
