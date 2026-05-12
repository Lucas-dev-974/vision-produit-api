import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Élargit `survey_responses.zone` pour stocker plusieurs codes séparés par
 * des virgules (ex. east,north,west) ou la valeur seule `all`.
 */
export class SurveyResponsesZoneMultiple1746380100000 implements MigrationInterface {
  name = 'SurveyResponsesZoneMultiple1746380100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMysql = queryRunner.connection.options.type === 'mysql';

    if (isMysql) {
      await queryRunner.query(`
        ALTER TABLE \`survey_responses\`
        MODIFY COLUMN \`zone\` varchar(120) NULL
      `);
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "survey_responses"
      ALTER COLUMN "zone" TYPE varchar(120)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMysql = queryRunner.connection.options.type === 'mysql';

    if (isMysql) {
      await queryRunner.query(`
        ALTER TABLE \`survey_responses\`
        MODIFY COLUMN \`zone\` varchar(20) NULL
      `);
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "survey_responses"
      ALTER COLUMN "zone" TYPE varchar(20)
    `);
  }
}
