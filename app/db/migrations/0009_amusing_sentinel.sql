CREATE TYPE "public"."talent_pool_status" AS ENUM('not_submitted', 'submitted');--> statement-breakpoint
CREATE TABLE "talent_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"url" text NOT NULL,
	"status" "talent_pool_status" DEFAULT 'not_submitted' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
