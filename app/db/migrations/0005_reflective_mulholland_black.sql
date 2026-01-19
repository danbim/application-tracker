CREATE TYPE "public"."job_track" AS ENUM('engineering', 'management');--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "track" "job_track";