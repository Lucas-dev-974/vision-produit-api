import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducerProfiles1745083200000 implements MigrationInterface {
  name = 'CreateProducerProfiles1745083200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "producer_profiles" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "public_location_lat" double precision,
        "public_location_lng" double precision,
        "average_rating" double precision NOT NULL DEFAULT 0,
        "total_ratings" integer NOT NULL DEFAULT 0,
        "reliability_score" double precision NOT NULL DEFAULT 0,
        "total_orders" integer NOT NULL DEFAULT 0,
        "additional_photos" jsonb NOT NULL DEFAULT '[]'::jsonb,
        CONSTRAINT "PK_producer_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_producer_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_producer_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "producer_profiles"`);
  }
}
