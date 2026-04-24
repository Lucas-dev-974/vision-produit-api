import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1745083300000 implements MigrationInterface {
  name = 'CreateProducts1745083300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "product_category_enum" AS ENUM (
          'fruits',
          'vegetables',
          'eggs',
          'honey',
          'poultry',
          'fish',
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL,
        "producer_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "category" "product_category_enum" NOT NULL,
        "description" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_producer_id" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_producer_id" ON "products" ("producer_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_category_enum"`);
  }
}
