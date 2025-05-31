import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1717076400000 implements MigrationInterface {
  name = 'InitialMigration1717076400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER',
        "password" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    // Create tasks table
    await queryRunner.query(`
      CREATE TYPE "public"."tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'COMPLETED')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')
    `);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "assignedToId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'TODO',
        "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "dueDate" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_assignedToId" ON "tasks" ("assignedToId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_createdById" ON "tasks" ("createdById")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_priority" ON "tasks" ("priority")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_assignedToId" 
      FOREIGN KEY ("assignedToId") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_createdById" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create extension for UUID generation if it doesn't exist
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_createdById"
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignedToId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_tasks_priority"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_tasks_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_tasks_createdById"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_tasks_assignedToId"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_users_email"
    `);

    // Drop tables
    await queryRunner.query(`
      DROP TABLE "tasks"
    `);

    await queryRunner.query(`
      DROP TABLE "users"
    `);

    // Drop enum types
    await queryRunner.query(`
      DROP TYPE "public"."tasks_priority_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."tasks_status_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."users_role_enum"
    `);
  }
}
