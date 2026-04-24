import type { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderSeenNotifications1745083500000 implements MigrationInterface {
  name = 'OrderSeenNotifications1745083500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "buyer_seen_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "producer_seen_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      UPDATE "orders"
      SET
        "buyer_seen_at" = COALESCE("buyer_seen_at", "created_at"),
        "producer_seen_at" = COALESCE("producer_seen_at", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "buyer_seen_at",
      DROP COLUMN IF EXISTS "producer_seen_at"
    `);
  }
}
