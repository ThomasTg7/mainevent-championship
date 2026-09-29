CREATE TYPE "public"."career_status" AS ENUM('active', 'inactive', 'retired');--> statement-breakpoint
CREATE TYPE "public"."fighter_stance" AS ENUM('orthodox', 'southpaw', 'switch');--> statement-breakpoint
CREATE TABLE "fighters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nickname" text,
	"gender" "fighter_gender" NOT NULL,
	"birth_date" date,
	"nationality" char(2) NOT NULL,
	"hometown" text,
	"division_id" uuid NOT NULL,
	"weight_kg" numeric(5, 1),
	"height_cm" integer,
	"reach_cm" integer,
	"stance" "fighter_stance",
	"gym" text,
	"coach" text,
	"base_discipline" text,
	"bio" text,
	"career_status" "career_status" DEFAULT 'active' NOT NULL,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"body_media_id" uuid,
	"headshot_media_id" uuid,
	"pro_wins" integer DEFAULT 0 NOT NULL,
	"pro_losses" integer DEFAULT 0 NOT NULL,
	"pro_draws" integer DEFAULT 0 NOT NULL,
	"pro_nc" integer DEFAULT 0 NOT NULL,
	"am_wins" integer DEFAULT 0 NOT NULL,
	"am_losses" integer DEFAULT 0 NOT NULL,
	"am_draws" integer DEFAULT 0 NOT NULL,
	"am_nc" integer DEFAULT 0 NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fighters_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "fighters" ADD CONSTRAINT "fighters_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighters" ADD CONSTRAINT "fighters_body_media_id_media_id_fk" FOREIGN KEY ("body_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighters" ADD CONSTRAINT "fighters_headshot_media_id_media_id_fk" FOREIGN KEY ("headshot_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fighters_status_idx" ON "fighters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fighters_publish_at_idx" ON "fighters" USING btree ("publish_at");--> statement-breakpoint
CREATE INDEX "fighters_deleted_at_idx" ON "fighters" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "fighters_division_id_idx" ON "fighters" USING btree ("division_id");--> statement-breakpoint
CREATE INDEX "fighters_body_media_id_idx" ON "fighters" USING btree ("body_media_id");--> statement-breakpoint
CREATE INDEX "fighters_headshot_media_id_idx" ON "fighters" USING btree ("headshot_media_id");--> statement-breakpoint
CREATE INDEX "fighters_nationality_idx" ON "fighters" USING btree ("nationality");--> statement-breakpoint
CREATE INDEX "fighters_career_status_idx" ON "fighters" USING btree ("career_status");