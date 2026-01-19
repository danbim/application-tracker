-- Add wow boolean column for special "wow factor" jobs
ALTER TABLE "job_openings" ADD COLUMN "wow" boolean NOT NULL DEFAULT false;
