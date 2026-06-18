import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: 'Validation error',
        issues: error.format(),
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        message: error.message,
      });
    }

    console.error('Unhandled error:', error);

    return reply.status(500).send({
      message: 'Internal server error',
    });
  });
}
