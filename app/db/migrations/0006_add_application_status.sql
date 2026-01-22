CREATE TYPE "application_status" AS ENUM (
  'not_applied',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'dumped'
);--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "status" "application_status" DEFAULT 'not_applied' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "applied_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "interviewing_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "offer_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "ghosted_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "dumped_at" timestamp;--> statement-breakpoint
UPDATE "job_openings"
SET "status" = 'applied', "applied_at" = "application_sent_date"::timestamp
WHERE "application_sent" = true;--> statement-breakpoint
ALTER TABLE "job_openings" DROP COLUMN "application_sent";--> statement-breakpoint
ALTER TABLE "job_openings" DROP COLUMN "application_sent_date";
