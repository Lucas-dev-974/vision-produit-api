import type { MigrationInterface, QueryRunner } from 'typeorm';

function createEnumIfNotExists(
  queryRunner: QueryRunner,
  name: string,
  values: string[],
): Promise<void> {
  const list = values.map((v) => `'${v}'`).join(', ');
  return queryRunner.query(`
    DO $$ BEGIN
      CREATE TYPE "${name}" AS ENUM (${list});
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

export class CreateCommerceMessaging1745083400000 implements MigrationInterface {
  name = 'CreateCommerceMessaging1745083400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await createEnumIfNotExists(queryRunner, 'stock_unit_enum', [
      'kg',
      'g',
      'bunch',
      'crate',
      'unit',
      'piece',
      'liter',
    ]);

    await createEnumIfNotExists(queryRunner, 'order_status_enum', [
      'pending',
      'accepted',
      'alternative_proposed',
      'confirmed',
      'honored',
      'not_honored',
      'cancelled',
      'refused',
    ]);

    await createEnumIfNotExists(queryRunner, 'report_category_enum', [
      'fake_profile',
      'inappropriate_content',
      'scam',
      'harassment',
      'other',
    ]);

    await createEnumIfNotExists(queryRunner, 'report_status_enum', [
      'open',
      'reviewed',
      'resolved',
      'dismissed',
    ]);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stocks" (
        "id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" numeric(10,2) NOT NULL,
        "unit" "stock_unit_enum" NOT NULL,
        "unit_price" numeric(10,2) NOT NULL,
        "available_from" date NOT NULL,
        "expires_at" date NOT NULL,
        CONSTRAINT "PK_stocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stocks_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stocks_product_id" ON "stocks" ("product_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL,
        "buyer_id" uuid NOT NULL,
        "producer_id" uuid NOT NULL,
        "status" "order_status_enum" NOT NULL DEFAULT 'pending',
        "retrieval_date" date NOT NULL,
        "retrieval_time_slot" character varying(50),
        "note" text,
        "cancellation_reason" text,
        "refusal_reason" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_producer_id" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_buyer_id" ON "orders" ("buyer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_producer_id" ON "orders" ("producer_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" numeric(10,2) NOT NULL,
        "unit" "stock_unit_enum" NOT NULL,
        "unit_price_snapshot" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_order_items_order_id" ON "order_items" ("order_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL,
        "buyer_id" uuid NOT NULL,
        "producer_id" uuid NOT NULL,
        "last_message_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversations_buyer_producer" UNIQUE ("buyer_id", "producer_id"),
        CONSTRAINT "FK_conversations_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversations_producer_id" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversations_buyer_id" ON "conversations" ("buyer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversations_producer_id" ON "conversations" ("producer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversations_last_message_at" ON "conversations" ("last_message_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL,
        "conversation_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" character varying(2000) NOT NULL,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender_id" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_id" ON "messages" ("conversation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_created_at" ON "messages" ("created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ratings" (
        "id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "rater_id" uuid NOT NULL,
        "rated_id" uuid NOT NULL,
        "stars" smallint NOT NULL,
        "comment" character varying(500),
        CONSTRAINT "PK_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ratings_order_rater" UNIQUE ("order_id", "rater_id"),
        CONSTRAINT "CHK_ratings_stars" CHECK ("stars" >= 1 AND "stars" <= 5),
        CONSTRAINT "FK_ratings_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_rater_id" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_rated_id" FOREIGN KEY ("rated_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ratings_order_id" ON "ratings" ("order_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid NOT NULL,
        "reporter_id" uuid NOT NULL,
        "target_user_id" uuid,
        "target_message_id" uuid,
        "category" "report_category_enum" NOT NULL,
        "description" text NOT NULL,
        "status" "report_status_enum" NOT NULL DEFAULT 'open',
        "admin_notes" text,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reports_reporter_id" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reports_target_user_id" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reports_target_message_id" FOREIGN KEY ("target_message_id") REFERENCES "messages"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reports_target_user_id" ON "reports" ("target_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reports_status" ON "reports" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_email_verification_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_verification_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_verification_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ratings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stocks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "stock_unit_enum"`);
  }
}
