CREATE TYPE "public"."work_location" AS ENUM('remote', 'hybrid', 'office');--> statement-breakpoint
CREATE TABLE "job_openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"job_location" varchar(255),
	"posting_url" varchar(2048),
	"date_opened" date,
	"date_added" timestamp DEFAULT now() NOT NULL,
	"application_sent" boolean DEFAULT false NOT NULL,
	"application_sent_date" date,
	"salary_amount" integer,
	"salary_currency" varchar(3),
	"pension_scheme" text,
	"health_insurance" text,
	"stock_options" text,
	"vacation_days" integer,
	"work_location" "work_location",
	"office_distance_km" integer,
	"wfh_days_per_week" integer,
	"rating_impact" integer,
	"rating_compensation" integer,
	"rating_role" integer,
	"rating_tech" integer,
	"rating_location" integer,
	"rating_industry" integer,
	"rating_culture" integer,
	"rating_growth" integer,
	"rating_profile_match" integer,
	"rating_company_size" integer,
	"rating_stress" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_formulas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"weights" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
