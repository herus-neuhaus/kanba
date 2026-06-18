import { FastifyInstance } from 'fastify';
import z from 'zod';
import { supabaseAuthClient } from '../../lib/supabase';
import { AuthService } from '../../services/auth.service';
import { serializeAgency, serializeProfileContext } from '../serializers';

export async function authRoutes(app: FastifyInstance) {
  // Configuração padrão de Cookies para tokens (httpOnly)
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  // POST /api/v1/auth/login
  app.post(
    '/auth/login',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as any;

      // Chama Supabase Auth
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return reply.status(401).send({ message: error?.message || 'Invalid credentials' });
      }

      // Definir cookies seguros (intermediário para o futuro)
      reply.setCookie('sb-access-token', data.session.access_token, {
        ...cookieOptions,
        maxAge: data.session.expires_in,
      });
      reply.setCookie('sb-refresh-token', data.session.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return reply.status(200).send({
        message: 'Login successful',
        // Para transição suave, enviamos a sessão pro front caso ele ainda precise
        session: data.session, 
      });
    }
  );

  // POST /api/v1/auth/logout
  app.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('sb-access-token', cookieOptions);
    reply.clearCookie('sb-refresh-token', cookieOptions);

    return reply.status(200).send({ message: 'Logged out' });
  });

  // POST /api/v1/auth/refresh
  app.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies['sb-refresh-token'];
    
    if (!refreshToken) {
      return reply.status(401).send({ message: 'No refresh token provided' });
    }

    const { data, error } = await supabaseAuthClient.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      reply.clearCookie('sb-access-token', cookieOptions);
      reply.clearCookie('sb-refresh-token', cookieOptions);
      return reply.status(401).send({ message: 'Invalid refresh token' });
    }

    reply.setCookie('sb-access-token', data.session.access_token, {
      ...cookieOptions,
      maxAge: data.session.expires_in,
    });
    reply.setCookie('sb-refresh-token', data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return reply.status(200).send({ message: 'Token refreshed', session: data.session });
  });

  // GET /api/v1/me
  app.get(
    '/me',
    {
      schema: {
        querystring: z.object({
          agency_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      // Pega token do header ou do cookie (transição suave)
      let token = request.cookies['sb-access-token'];
      
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      if (!token) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      try {
        const agencyIdHeader = request.headers['x-agency-id'] as string;
        const agencyId = agencyIdHeader || (request.query as any)?.agency_id;
        const context = await AuthService.resolveUserContext(token, agencyId);
        
        return reply.status(200).send({
          user: context.user,
          profile: serializeProfileContext(context),
          agency: serializeAgency(context.activeAgency)
        });
      } catch (error) {
        return reply.status(401).send({ message: error instanceof Error ? error.message : 'Unauthorized' });
      }
    }
  );

  // PATCH /api/v1/me/profile
  app.patch(
    '/me/profile',
    {
      schema: {
        body: z.object({
          full_name: z.string().optional(),
          phone: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      let token = request.cookies['sb-access-token'];
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      if (!token) return reply.status(401).send({ message: 'Unauthorized' });

      try {
        const agencyIdHeader = request.headers['x-agency-id'] as string;
        const context = await AuthService.resolveUserContext(token, agencyIdHeader);
        const { full_name, phone } = request.body as any;

        // Importing db and profiles
        const { db } = await import('../../db');
        const { profiles } = await import('../../db/schema');
        const { eq } = await import('drizzle-orm');

        const updates: any = {};
        if (full_name !== undefined) updates.fullName = full_name;
        if (phone !== undefined) updates.phone = phone;

        await db
          .update(profiles)
          .set(updates)
          .where(eq(profiles.id, context.user.id));

        return reply.send({ message: 'Profile updated' });
      } catch (error) {
        return reply.status(401).send({ message: error instanceof Error ? error.message : 'Unauthorized' });
      }
    }
  );
}
