ALTER TABLE "job_openings" RENAME COLUMN "salary_amount" TO "salary_min";--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "salary_max" integer;