CREATE TYPE "public"."media_kind" AS ENUM('fighter_body', 'fighter_headshot', 'event_hero', 'event_hero_mobile', 'event_poster', 'news_cover', 'gallery', 'sponsor_logo', 'og_image');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'ready');--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"original_key" text NOT NULL,
	"mime" text NOT NULL,
	"width" integer,
	"height" integer,
	"crop" jsonb,
	"rotation" integer DEFAULT 0 NOT NULL,
	"focal_x" real DEFAULT 0.5 NOT NULL,
	"focal_y" real DEFAULT 0.5 NOT NULL,
	"adjustments" jsonb DEFAULT '{"brightness":1,"contrast":1,"saturation":1}'::jsonb NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "media_status_created_at_idx" ON "media" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "media_deleted_at_idx" ON "media" USING btree ("deleted_at");