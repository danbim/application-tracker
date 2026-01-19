-- Add salary range columns
ALTER TABLE "job_openings" ADD COLUMN "salary_min" integer;
ALTER TABLE "job_openings" ADD COLUMN "salary_max" integer;

-- Migrate existing data: copy salary_amount to salary_min (treating single value as minimum)
UPDATE "job_openings" SET "salary_min" = "salary_amount" WHERE "salary_amount" IS NOT NULL;

-- Drop the old column
ALTER TABLE "job_openings" DROP COLUMN "salary_amount";
