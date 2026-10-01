CREATE TABLE "fighter_gallery" (
	"fighter_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "fighter_gallery_fighter_id_media_id_pk" PRIMARY KEY("fighter_id","media_id")
);
--> statement-breakpoint
ALTER TABLE "fighter_gallery" ADD CONSTRAINT "fighter_gallery_fighter_id_fighters_id_fk" FOREIGN KEY ("fighter_id") REFERENCES "public"."fighters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighter_gallery" ADD CONSTRAINT "fighter_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fighter_gallery_media_id_idx" ON "fighter_gallery" USING btree ("media_id");