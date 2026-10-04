ALTER TABLE "posts" ADD COLUMN "has_media" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "posts_has_media_idx" ON "posts" USING btree ("has_media");--> statement-breakpoint
-- Relleno de las noticias que ya existen: con galería, o con una publicación/video (nodo "embed") en el cuerpo.
UPDATE "posts" SET "has_media" = true WHERE EXISTS (SELECT 1 FROM "post_gallery" WHERE "post_gallery"."post_id" = "posts"."id") OR jsonb_path_exists("posts"."body", '$.** ? (@.type == "embed")');
