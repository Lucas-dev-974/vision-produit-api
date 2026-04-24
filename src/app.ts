import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { v1Router } from './routes/v1-router';
import { errorHandler } from './middlewares/error-handler';

export function createApp(): express.Express {
  const app = express();
  // L'app tourne derrière un reverse-proxy (Passenger/cPanel, nginx, etc.) qui
  // injecte `X-Forwarded-For`. Nécessaire pour que `req.ip` et
  // `express-rate-limit` utilisent la vraie IP client au lieu de refuser le header.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));
  app.use('/v1', v1Router);
  app.use(errorHandler);
  return app;
}
