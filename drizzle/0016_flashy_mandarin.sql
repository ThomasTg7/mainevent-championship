CREATE TYPE "public"."sponsor_tier" AS ENUM('principal', 'oficial', 'colaborador');--> statement-breakpoint
CREATE TABLE "sponsor_events" (
	"sponsor_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	CONSTRAINT "sponsor_events_sponsor_id_event_id_pk" PRIMARY KEY("sponsor_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_media_id" uuid NOT NULL,
	"url" text,
	"tier" "sponsor_tier" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"all_events" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sponsor_events" ADD CONSTRAINT "sponsor_events_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_events" ADD CONSTRAINT "sponsor_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sponsor_events_event_id_idx" ON "sponsor_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "sponsors_logo_media_id_idx" ON "sponsors" USING btree ("logo_media_id");--> statement-breakpoint
CREATE INDEX "sponsors_deleted_at_idx" ON "sponsors" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "sponsors_tier_sort_order_idx" ON "sponsors" USING btree ("tier","sort_order");