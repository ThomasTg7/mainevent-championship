CREATE TABLE "dismissed_suggestions" (
	"event_id" uuid NOT NULL,
	"fighter_id" uuid NOT NULL,
	"scope_key" text NOT NULL,
	CONSTRAINT "dismissed_suggestions_event_id_fighter_id_scope_key_pk" PRIMARY KEY("event_id","fighter_id","scope_key")
);
--> statement-breakpoint
CREATE TABLE "ranking_entries" (
	"version_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"fighter_id" uuid NOT NULL,
	CONSTRAINT "ranking_entries_version_id_position_pk" PRIMARY KEY("version_id","position"),
	CONSTRAINT "ranking_entries_version_fighter_unique" UNIQUE("version_id","fighter_id")
);
--> statement-breakpoint
CREATE TABLE "ranking_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "bout_level" NOT NULL,
	"division_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "bout_level" NOT NULL,
	"division_id" uuid NOT NULL,
	"champion_fighter_id" uuid,
	"since" date,
	CONSTRAINT "titles_level_division_unique" UNIQUE("level","division_id")
);
--> statement-breakpoint
ALTER TABLE "dismissed_suggestions" ADD CONSTRAINT "dismissed_suggestions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dismissed_suggestions" ADD CONSTRAINT "dismissed_suggestions_fighter_id_fighters_id_fk" FOREIGN KEY ("fighter_id") REFERENCES "public"."fighters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_version_id_ranking_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."ranking_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_fighter_id_fighters_id_fk" FOREIGN KEY ("fighter_id") REFERENCES "public"."fighters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_versions" ADD CONSTRAINT "ranking_versions_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_champion_fighter_id_fighters_id_fk" FOREIGN KEY ("champion_fighter_id") REFERENCES "public"."fighters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dismissed_suggestions_fighter_id_idx" ON "dismissed_suggestions" USING btree ("fighter_id");--> statement-breakpoint
CREATE INDEX "ranking_entries_fighter_id_idx" ON "ranking_entries" USING btree ("fighter_id");--> statement-breakpoint
CREATE INDEX "ranking_versions_scope_idx" ON "ranking_versions" USING btree ("level","division_id","created_at");--> statement-breakpoint
CREATE INDEX "titles_champion_fighter_id_idx" ON "titles" USING btree ("champion_fighter_id");