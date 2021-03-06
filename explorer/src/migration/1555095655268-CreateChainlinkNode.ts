import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChainlinkNode1555095655268 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE "chainlink_node" (
      "id" BIGSERIAL PRIMARY KEY,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "name" CHARACTER VARYING UNIQUE,
      "accessKey" VARCHAR(32) UNIQUE,
      "hashedSecret" VARCHAR(64) NOT NULL,
      "salt" VARCHAR(64) NOT NULL
    )`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX chainlink_node_access_key_idx ON "chainlink_node" ("accessKey")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
