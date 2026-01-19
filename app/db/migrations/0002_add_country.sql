-- Add country column (ISO 3166-1 alpha-2 code)
ALTER TABLE "job_openings" ADD COLUMN "country" varchar(2);
