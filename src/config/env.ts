import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
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

  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  INSEE_API_KEY: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export function shouldRunMigrationsOnStart(): boolean {
  if (env.RUN_MIGRATIONS_ON_START === 'false') return false;
  if (env.RUN_MIGRATIONS_ON_START === 'true') return true;
  return env.NODE_ENV === 'development';
}
