-- AlterTable: add nullable job_title to feedbacks
-- Safe for existing rows: no NOT NULL constraint, no DEFAULT required
ALTER TABLE "feedbacks" ADD COLUMN "job_title" TEXT;
