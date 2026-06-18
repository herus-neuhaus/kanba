import fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import cookie from '@fastify/cookie';
import { env } from './config/env';
import { errorHandler } from './http/errors';
import { healthRoutes } from './http/routes/health.routes';
import { authRoutes } from './http/routes/auth.routes';
import { spacesRoutes } from './http/routes/spaces.routes';
import { projectsRoutes } from './http/routes/projects.routes';
import { tasksRoutes } from './http/routes/tasks.routes';
import { integrationsRoutes } from './http/routes/integrations.routes';
import { invitesRoutes } from './http/routes/invites.routes';
import { columnsRoutes } from './http/routes/columns.routes';
import { teamRoutes } from './http/routes/team.routes';
import { projectPermissionsRoutes } from './http/routes/project-permissions.routes';
import { agenciesRoutes } from './http/routes/agencies.routes';
import { aiRoutes } from './http/routes/ai.routes';
import { notificationsRoutes } from './http/routes/notifications.routes';
import { cronRoutes } from './http/routes/cron.routes';
import { crmRoutes } from './http/routes/crm.routes';
import { wikiRoutes } from './http/routes/wiki.routes';
import { rolesRoutes } from './http/routes/roles.routes';
import { inAppNotificationsRoutes } from './http/routes/in_app_notifications.routes';

export const app = fastify({
  logger: env.NODE_ENV === 'development',
}).withTypeProvider<ZodTypeProvider>();

// Setup Type Providers for Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Plugins
app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});
app.register(cookie);

// Error handling
errorHandler(app);

// Routes
app.register(healthRoutes);
app.register(authRoutes, { prefix: '/api/v1' });
app.register(spacesRoutes, { prefix: '/api/v1' });
app.register(projectsRoutes, { prefix: '/api/v1' });
app.register(tasksRoutes, { prefix: '/api/v1' });
app.register(columnsRoutes, { prefix: '/api/v1' });
app.register(integrationsRoutes, { prefix: '/api/v1' });
app.register(invitesRoutes, { prefix: '/api/v1' });
app.register(teamRoutes, { prefix: '/api/v1' });
app.register(projectPermissionsRoutes, { prefix: '/api/v1' });
app.register(agenciesRoutes, { prefix: '/api/v1' });
app.register(aiRoutes, { prefix: '/api/v1' });
app.register(notificationsRoutes, { prefix: '/api/v1' });
app.register(cronRoutes, { prefix: '/api/v1' });
app.register(crmRoutes, { prefix: '/api/v1' });
app.register(wikiRoutes, { prefix: '/api/v1' });
app.register(rolesRoutes, { prefix: '/api/v1' });
app.register(inAppNotificationsRoutes, { prefix: '/api/v1' });

if (env.NODE_ENV === 'development') {
  const { debugRoutes } = require('./http/routes/debug.routes');
  app.register(debugRoutes);
}
