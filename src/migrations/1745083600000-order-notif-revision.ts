import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remplace la logique "updated_at > seen_at" par une révision dédiée aux pastilles
 * (incrémentée sur les seuls changements d'état métier).
 */
export class OrderNotifRevision1745083600000 implements MigrationInterface {
  name = 'OrderNotifRevision1745083600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "notif_revision" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "buyer_notif_ack" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "producer_notif_ack" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      UPDATE "orders"
      SET
        "notif_revision" = 1,
        "buyer_notif_ack" = 1,
        "producer_notif_ack" = CASE
          WHEN "status"::text = 'pending' THEN 0
          ELSE 1
        END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "notif_revision",
      DROP COLUMN IF EXISTS "buyer_notif_ack",
      DROP COLUMN IF EXISTS "producer_notif_ack"
    `);
  }
}
