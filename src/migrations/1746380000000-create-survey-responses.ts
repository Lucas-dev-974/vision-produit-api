import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSurveyResponses1746380000000 implements MigrationInterface {
  name = 'CreateSurveyResponses1746380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMysql = queryRunner.connection.options.type === 'mysql';

    if (isMysql) {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS \`survey_responses\` (
          \`id\` varchar(36) NOT NULL,
          \`contact_name\` varchar(120) NULL,
          \`contact_email\` varchar(255) NOT NULL,
          \`contact_phone\` varchar(30) NOT NULL,
          \`role\` enum('producer','merchant','both') NOT NULL,
          \`activity_type\` varchar(120) NULL,
          \`zone\` varchar(20) NULL,
          \`size_bracket\` varchar(20) NULL,
          \`answers\` json NOT NULL,
          \`consent_rgpd\` tinyint(1) NOT NULL DEFAULT 0,
          \`consent_recontact\` tinyint(1) NOT NULL DEFAULT 0,
          \`status\` enum('new','reviewed','archived') NOT NULL DEFAULT 'new',
          \`source\` varchar(100) NULL,
          \`created_ip\` varchar(45) NULL,
          \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_survey_responses_email\` (\`contact_email\`),
          INDEX \`IDX_survey_responses_role\` (\`role\`),
          INDEX \`IDX_survey_responses_status\` (\`status\`)
        ) ENGINE=InnoDB
      `);
      return;
    }

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "survey_respondent_role_enum" AS ENUM ('producer', 'merchant', 'both');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "survey_response_status_enum" AS ENUM ('new', 'reviewed', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "survey_responses" (
        "id" uuid NOT NULL,
        "contact_name" varchar(120),
        "contact_email" varchar(255) NOT NULL,
        "contact_phone" varchar(30) NOT NULL,
        "role" "survey_respondent_role_enum" NOT NULL,
        "activity_type" varchar(120),
        "zone" varchar(20),
        "size_bracket" varchar(20),
        "answers" jsonb NOT NULL,
        "consent_rgpd" boolean NOT NULL DEFAULT false,
        "consent_recontact" boolean NOT NULL DEFAULT false,
        "status" "survey_response_status_enum" NOT NULL DEFAULT 'new',
        "source" varchar(100),
        "created_ip" varchar(45),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_responses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_survey_responses_email" ON "survey_responses" ("contact_email")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_survey_responses_role" ON "survey_responses" ("role")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_survey_responses_status" ON "survey_responses" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMysql = queryRunner.connection.options.type === 'mysql';

    if (isMysql) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`survey_responses\``);
      return;
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_survey_responses_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_survey_responses_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_survey_responses_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_responses"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "survey_response_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "survey_respondent_role_enum"`);
  }
}
