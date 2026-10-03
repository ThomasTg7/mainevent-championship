CREATE TYPE "public"."inbox_kind" AS ENUM('fighter_application', 'sponsorship');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('new', 'contacted', 'discarded');--> statement-breakpoint
CREATE TABLE "form_rate_limits" (
	"ip_hash" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "inbox_kind" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"payload" jsonb NOT NULL,
	"status" "inbox_status" DEFAULT 'new' NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "form_rate_limits_window_start_idx" ON "form_rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "inbox_messages_status_created_at_idx" ON "inbox_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "inbox_messages_kind_status_created_at_idx" ON "inbox_messages" USING btree ("kind","status","created_at");