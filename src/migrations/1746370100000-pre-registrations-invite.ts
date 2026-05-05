import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PreRegistrationsInvite1746370100000 implements MigrationInterface {
  name = 'PreRegistrationsInvite1746370100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajout du statut `invited` à l'enum existant.
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "pre_registrations_status_enum" ADD VALUE IF NOT EXISTS 'invited' BEFORE 'approved';
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "pre_registrations"
        ADD COLUMN IF NOT EXISTS "invite_token_hash" varchar(64),
        ADD COLUMN IF NOT EXISTS "invite_token_expires_at" timestamptz,
        ADD COLUMN IF NOT EXISTS "invited_at" timestamptz,
        ADD COLUMN IF NOT EXISTS "accepted_at" timestamptz,
        ADD COLUMN IF NOT EXISTS "accepted_user_id" varchar(36)
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pre_registrations_invite_token_hash" ON "pre_registrations" ("invite_token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pre_registrations_invite_token_hash"`,
    );
    await queryRunner.query(`
      ALTER TABLE "pre_registrations"
        DROP COLUMN IF EXISTS "accepted_user_id",
        DROP COLUMN IF EXISTS "accepted_at",
        DROP COLUMN IF EXISTS "invited_at",
        DROP COLUMN IF EXISTS "invite_token_expires_at",
        DROP COLUMN IF EXISTS "invite_token_hash"
    `);
    // L'enum laisse `invited` (Postgres ne supporte pas DROP VALUE proprement).
  }
}
