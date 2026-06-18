import { app } from './app';
import { env } from './config/env';

async function bootstrap() {
  try {
    const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server listening at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
