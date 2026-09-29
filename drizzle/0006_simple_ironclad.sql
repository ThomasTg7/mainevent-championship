CREATE TYPE "public"."fighter_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"gender" "fighter_gender" NOT NULL,
	"limit_kg" numeric(5, 1) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ranking_slots" integer DEFAULT 5 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "divisions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "divisions_gender_sort_order_idx" ON "divisions" USING btree ("gender","sort_order");--> statement-breakpoint
CREATE INDEX "divisions_active_idx" ON "divisions" USING btree ("active");