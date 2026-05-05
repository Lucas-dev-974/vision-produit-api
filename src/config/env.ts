import { config } from 'dotenv';
import { z } from 'zod';

config();

/**
 * Variante de `z.string()` qui considère une chaîne vide comme absente.
 * Indispensable pour les `.env` où les variables optionnelles sont souvent
 * laissées sous la forme `KEY=` (chaîne vide) plutôt que retirées.
 */
const optionalString = () =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().optional(),
  );

const optionalEmail = () =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().email().optional(),
  );

const optionalUrl = () =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().url().optional(),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_TYPE: z.enum(['mysql', 'postgres']).default('mysql'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_SYNC: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  /**
   * Si non défini : en `development`, exécuter les migrations TypeORM après connexion (recommandé si DB_SYNC=false).
   * Mettre `false` pour désactiver (ex. CI qui lance `migration:run` à part).
   */
  RUN_MIGRATIONS_ON_START: z.enum(['true', 'false']).optional(),

  CORS_ORIGIN: z.string().min(1),

  /**
   * URL publique du frontend (utilisée dans les liens des e-mails).
   * Par défaut on retombe sur CORS_ORIGIN.
   */
  PUBLIC_APP_URL: optionalUrl(),

  /**
   * `false` = phase de pré-lancement : seuls les comptes `admin` peuvent
   * se connecter, et les routes `/auth/register` / `/auth/forgot-password`
   * sont fermées. Les pré-inscriptions publiques restent ouvertes.
   */
  APP_ACCESS_OPEN: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  INSEE_API_KEY: optionalString(),
  BREVO_API_KEY: optionalString(),
  BREVO_SENDER_EMAIL: optionalEmail(),
  BREVO_SENDER_NAME: optionalString(),
  /** Adresse interne destinataire des notifications de pré-inscription. */
  ADMIN_NOTIFICATION_EMAIL: optionalEmail(),
  S3_ENDPOINT: optionalString(),
  S3_BUCKET: optionalString(),
  S3_ACCESS_KEY: optionalString(),
  S3_SECRET_KEY: optionalString(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export function shouldRunMigrationsOnStart(): boolean {
  if (env.RUN_MIGRATIONS_ON_START === 'false') return false;
  if (env.RUN_MIGRATIONS_ON_START === 'true') return true;
  return env.NODE_ENV === 'development';
}

export function getPublicAppUrl(): string {
  return (env.PUBLIC_APP_URL ?? env.CORS_ORIGIN).replace(/\/$/, '');
}
