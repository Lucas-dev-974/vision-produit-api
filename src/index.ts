import 'reflect-metadata';
import http from 'http';
import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { env, shouldRunMigrationsOnStart } from './config/env';
import { logger } from './lib/logger';
import { attachMessagingWebSocket } from './modules/messaging/messaging.ws';

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  if (shouldRunMigrationsOnStart() && !env.DB_SYNC) {
    const ran = await AppDataSource.runMigrations();
    if (ran.length > 0) {
      logger.info({ migrations: ran.map((m) => m.name) }, 'Migrations TypeORM appliquées');
    }
  }
  logger.info('Base de données connectée');
  const app = createApp();
  const server = http.createServer(app);
  attachMessagingWebSocket(server);
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Serveur HTTP + WebSocket messagerie en ecoute');
  });
}

bootstrap().catch((err: unknown) => {
  logger.error({ err }, 'Échec du démarrage');
  process.exit(1);
});
