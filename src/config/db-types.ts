import type { ColumnOptions, ColumnType } from 'typeorm';
import type { PrimaryColumnOptions } from 'typeorm/decorator/options/PrimaryColumnOptions';
import { env } from './env';

const isMysql = env.DB_TYPE === 'mysql';

/**
 * Alias de types de colonnes portables MySQL/PostgreSQL.
 *
 * - `timestamptz` (Postgres) → `datetime` (MySQL)
 * - `jsonb` (Postgres) → `json` (MySQL)
 * - `double precision` (Postgres) → `double` (MySQL)
 * - `uuid` (Postgres) → `varchar(36)` (MySQL)
 */

export const TIMESTAMPTZ_TYPE = (isMysql ? 'datetime' : 'timestamptz') as ColumnType;
export const JSON_TYPE = (isMysql ? 'json' : 'jsonb') as ColumnType;
export const DOUBLE_TYPE = (isMysql ? 'double' : 'double precision') as ColumnType;

export const JSON_ARRAY_DEFAULT = (): string =>
  isMysql ? '(JSON_ARRAY())' : "'[]'::jsonb";

export const uuidColumn = (
  overrides: Partial<ColumnOptions> = {},
): ColumnOptions =>
  isMysql
    ? { type: 'varchar', length: 36, ...overrides }
    : { type: 'uuid', ...overrides };

export const uuidPrimaryColumn = (
  overrides: Partial<PrimaryColumnOptions> = {},
): PrimaryColumnOptions =>
  isMysql
    ? { type: 'varchar', length: 36, ...overrides }
    : { type: 'uuid', ...overrides };
