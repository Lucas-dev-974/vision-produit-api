import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/app-error';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const ERROR_LOG_PATH = path.join(process.cwd(), 'errors.log');

/**
 * Écrit une entrée d'erreur dans `errors.log` à la racine du projet.
 * Volontairement "fire-and-forget" : on ne bloque pas la réponse HTTP,
 * et une éventuelle erreur d'écriture disque est reportée au logger Pino.
 */
function writeErrorToFile(req: Request, err: unknown): void {
  const e = (err && typeof err === 'object' ? (err as Record<string, unknown>) : {});
  const entry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    name: e.name,
    message: e.message,
    code: e.code,
    sql: e.sql,
    sqlMessage: e.sqlMessage,
    stack: typeof e.stack === 'string' ? e.stack : undefined,
  };
  const line = JSON.stringify(entry) + '\n';

  void mkdir(path.dirname(ERROR_LOG_PATH), { recursive: true })
    .then(() => appendFile(ERROR_LOG_PATH, line, 'utf8'))
    .catch((writeErr) => {
      logger.error({ err: writeErr }, 'Impossible d’écrire dans errors.log');
    });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Entrée invalide',
        details: err.flatten(),
      },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  writeErrorToFile(req, err);

  // En `development`, on renvoie le détail complet pour faciliter le debug.
  // En `production`, message générique.
  const isDev = env.NODE_ENV === 'development';
  const payload: Record<string, unknown> = {
    code: 'INTERNAL_ERROR',
    message: 'Une erreur est survenue',
  };

  if (isDev && err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    payload.debug = {
      name: e.name,
      message: e.message,
      code: e.code,
      sql: e.sql,
      sqlMessage: e.sqlMessage,
      stack: typeof e.stack === 'string' ? e.stack.split('\n').slice(0, 10) : undefined,
    };
  }

  res.status(500).json({ error: payload });
}
