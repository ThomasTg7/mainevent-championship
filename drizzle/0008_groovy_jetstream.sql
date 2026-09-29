CREATE TYPE "public"."bonus" AS ENUM('fight_of_night', 'performance_of_night', 'ko_of_night', 'sub_of_night');--> statement-breakpoint
CREATE TYPE "public"."bout_level" AS ENUM('pro', 'amateur');--> statement-breakpoint
CREATE TYPE "public"."method" AS ENUM('ko_tko', 'submission', 'decision', 'technical_decision', 'disqualification', 'no_contest');--> statement-breakpoint
CREATE TYPE "public"."outcome" AS ENUM('red_win', 'blue_win', 'draw', 'no_contest');--> statement-breakpoint
CREATE TYPE "public"."bout_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."decision_type" AS ENUM('unanimous', 'split', 'majority');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ko_tko_type" AS ENUM('ko', 'tko_strikes', 'tko_doctor', 'tko_corner', 'tko_injury');--> statement-breakpoint
CREATE TYPE "public"."nc_reason" AS ENUM('accidental_foul', 'overturned', 'other');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('tap', 'verbal', 'strikes');--> statement-breakpoint
CREATE TABLE "bouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"red_fighter_id" uuid NOT NULL,
	"blue_fighter_id" uuid NOT NULL,
	"division_id" uuid,
	"catchweight_kg" numeric(5, 1),
	"level" "bout_level" DEFAULT 'pro' NOT NULL,
	"scheduled_rounds" integer DEFAULT 3 NOT NULL,
	"round_seconds" integer DEFAULT 300 NOT NULL,
	"is_title_fight" boolean DEFAULT false NOT NULL,
	"bout_status" "bout_status" DEFAULT 'scheduled' NOT NULL,
	"cancel_reason" text,
	"outcome" "outcome",
	"method" "method",
	"ko_tko_type" "ko_tko_type",
	"submission_technique_id" uuid,
	"submission_type" "submission_type",
	"decision_type" "decision_type",
	"dq_reason" text,
	"nc_reason" "nc_reason",
	"nc_note" text,
	"end_round" integer,
	"end_time_seconds" integer,
	"referee" text,
	"scorecards" jsonb,
	"bonuses" "bonus"[] DEFAULT '{}' NOT NULL,
	"overturned_from" jsonb,
	"video_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bouts_corners_differ" CHECK ("bouts"."red_fighter_id" <> "bouts"."blue_fighter_id"),
	CONSTRAINT "bouts_scheduled_rounds_valid" CHECK ("bouts"."scheduled_rounds" in (3, 5)),
	CONSTRAINT "bouts_round_seconds_valid" CHECK ("bouts"."round_seconds" between 60 and 600)
);
--> statement-breakpoint
CREATE TABLE "card_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_gallery" (
	"event_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "event_gallery_event_id_media_id_pk" PRIMARY KEY("event_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"number" integer,
	"starts_at" timestamp with time zone NOT NULL,
	"doors_at" timestamp with time zone,
	"ends_estimated_at" timestamp with time zone,
	"venue_name" text NOT NULL,
	"venue_address" text NOT NULL,
	"venue_city" text NOT NULL,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"hero_media_id" uuid,
	"hero_mobile_media_id" uuid,
	"poster_media_id" uuid,
	"ticket_url" text,
	"ticket_provider" text,
	"ticket_tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ticket_points" text,
	"stream_url" text,
	"event_status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "submission_techniques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "submission_techniques_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "bouts" ADD CONSTRAINT "bouts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bouts" ADD CONSTRAINT "bouts_segment_id_card_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."card_segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bouts" ADD CONSTRAINT "bouts_red_fighter_id_fighters_id_fk" FOREIGN KEY ("red_fighter_id") REFERENCES "public"."fighters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bouts" ADD CONSTRAINT "bouts_blue_fighter_id_fighters_id_fk" FOREIGN KEY ("blue_fighter_id") REFERENCES "public"."fighters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bouts" ADD CONSTRAINT "bouts_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bouts" ADD CONSTRAINT "bouts_submission_technique_id_submission_techniques_id_fk" FOREIGN KEY ("submission_technique_id") REFERENCES "public"."submission_techniques"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_segments" ADD CONSTRAINT "card_segments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hero_mobile_media_id_media_id_fk" FOREIGN KEY ("hero_mobile_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_poster_media_id_media_id_fk" FOREIGN KEY ("poster_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bouts_event_id_idx" ON "bouts" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "bouts_segment_sort_idx" ON "bouts" USING btree ("segment_id","sort_order");--> statement-breakpoint
CREATE INDEX "bouts_red_fighter_id_idx" ON "bouts" USING btree ("red_fighter_id");--> statement-breakpoint
CREATE INDEX "bouts_blue_fighter_id_idx" ON "bouts" USING btree ("blue_fighter_id");--> statement-breakpoint
CREATE INDEX "bouts_division_id_idx" ON "bouts" USING btree ("division_id");--> statement-breakpoint
CREATE INDEX "bouts_submission_technique_id_idx" ON "bouts" USING btree ("submission_technique_id");--> statement-breakpoint
CREATE INDEX "bouts_bout_status_idx" ON "bouts" USING btree ("bout_status");--> statement-breakpoint
CREATE INDEX "card_segments_event_sort_idx" ON "card_segments" USING btree ("event_id","sort_order");--> statement-breakpoint
CREATE INDEX "event_gallery_media_id_idx" ON "event_gallery" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_publish_at_idx" ON "events" USING btree ("publish_at");--> statement-breakpoint
CREATE INDEX "events_deleted_at_idx" ON "events" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_event_status_idx" ON "events" USING btree ("event_status");--> statement-breakpoint
CREATE INDEX "events_hero_media_id_idx" ON "events" USING btree ("hero_media_id");--> statement-breakpoint
CREATE INDEX "events_hero_mobile_media_id_idx" ON "events" USING btree ("hero_mobile_media_id");--> statement-breakpoint
CREATE INDEX "events_poster_media_id_idx" ON "events" USING btree ("poster_media_id");