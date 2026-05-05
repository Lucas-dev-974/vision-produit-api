import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ReportsAddCreatedAt1746370200000 implements MigrationInterface {
  name = 'ReportsAddCreatedAt1746370200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reports"
        ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now()
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reports_created_at" ON "reports" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reports_created_at"`);
    await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN IF EXISTS "created_at"`);
  }
}
