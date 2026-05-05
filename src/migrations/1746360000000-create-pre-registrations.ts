import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePreRegistrations1746360000000 implements MigrationInterface {
  name = 'CreatePreRegistrations1746360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pre_registrations_role_enum" AS ENUM ('producer', 'buyer', 'undecided');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pre_registrations_status_enum" AS ENUM (
          'pending_email', 'pending_review', 'contacted', 'approved', 'rejected'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pre_registrations" (
        "id" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "role" "pre_registrations_role_enum" NOT NULL,
        "company_name" varchar(255),
        "siret" varchar(14),
        "phone" varchar(20),
        "city" varchar(100),
        "postal_code" varchar(10),
        "message" text,
        "consent_rgpd" boolean NOT NULL DEFAULT false,
        "status" "pre_registrations_status_enum" NOT NULL DEFAULT 'pending_email',
        "source" varchar(100),
        "confirmation_token_hash" varchar(64),
        "confirmation_token_expires_at" timestamptz,
        "email_confirmed_at" timestamptz,
        "created_ip" varchar(45),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pre_registrations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pre_registrations_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pre_registrations_status" ON "pre_registrations" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pre_registrations_token_hash" ON "pre_registrations" ("confirmation_token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pre_registrations_token_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pre_registrations_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pre_registrations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pre_registrations_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pre_registrations_role_enum"`);
  }
}
