import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from '../common/errors/app-error';

/**
 * Bloque l'endpoint si la plateforme est en phase de pré-lancement
 * (`APP_ACCESS_OPEN=false`). À utiliser sur les routes d'inscription /
 * réinitialisation publiques pendant la phase fermée.
 *
 * Le login reste accessible : on filtre côté `auth.service.login` pour
 * autoriser uniquement les comptes `admin` quand l'accès n'est pas ouvert.
 */
export function appAccessGate(_req: Request, _res: Response, next: NextFunction): void {
  if (env.APP_ACCESS_OPEN) {
    next();
    return;
  }
  next(
    new AppError(
      'ACCESS_NOT_OPEN',
      "L'inscription publique n'est pas encore ouverte. Pré-inscrivez-vous depuis la page d'accueil.",
      403,
    ),
  );
}
