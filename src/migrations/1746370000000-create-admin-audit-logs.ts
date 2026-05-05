import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAuditLogs1746370000000 implements MigrationInterface {
  name = 'CreateAdminAuditLogs1746370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admin_audit_target_enum" AS ENUM ('user', 'pre_registration', 'report', 'system');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
        "id" uuid NOT NULL,
        "admin_id" uuid,
        "action" varchar(64) NOT NULL,
        "target_type" "admin_audit_target_enum" NOT NULL,
        "target_id" uuid,
        "payload" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admin_audit_logs_admin"
          FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_audit_logs_admin_id" ON "admin_audit_logs" ("admin_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_audit_logs_action" ON "admin_audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_audit_logs_target_type" ON "admin_audit_logs" ("target_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_logs_target_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_logs_admin_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_logs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_audit_target_enum"`);
  }
}
