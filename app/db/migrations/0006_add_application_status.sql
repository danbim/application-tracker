-- Create application status enum
CREATE TYPE "application_status" AS ENUM (
  'not_applied',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'dumped'
);

-- Add status column with default
ALTER TABLE "job_openings" ADD COLUMN "status" "application_status" DEFAULT 'not_applied' NOT NULL;

-- Add timestamp columns for each status
ALTER TABLE "job_openings" ADD COLUMN "applied_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "interviewing_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "offer_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "rejected_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "ghosted_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "dumped_at" timestamp;

-- Migrate existing data
UPDATE "job_openings"
SET "status" = 'applied', "applied_at" = "application_sent_date"::timestamp
WHERE "application_sent" = true;

-- Drop old columns
ALTER TABLE "job_openings" DROP COLUMN "application_sent";
ALTER TABLE "job_openings" DROP COLUMN "application_sent_date";
