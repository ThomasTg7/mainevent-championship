CREATE TABLE "event_watch_platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_watch_platforms" ADD CONSTRAINT "event_watch_platforms_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_watch_platforms" ADD CONSTRAINT "event_watch_platforms_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_watch_platforms_event_sort_idx" ON "event_watch_platforms" USING btree ("event_id","sort_order");--> statement-breakpoint
CREATE INDEX "event_watch_platforms_media_idx" ON "event_watch_platforms" USING btree ("media_id");
--> statement-breakpoint
INSERT INTO "event_watch_platforms" ("event_id", "name", "url", "sort_order")
SELECT "id", 'Transmisión oficial', "stream_url", 0 FROM "events"
WHERE "stream_url" IS NOT NULL AND "stream_url" <> '';
