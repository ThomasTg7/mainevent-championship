CREATE TABLE "ranking_levels" (
	"level" "bout_level" PRIMARY KEY NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Lo que ya estaba armado sigue a la vista (antes no había forma de ocultarlo); un nivel sin nada queda oculto.
INSERT INTO "ranking_levels" ("level", "is_public") SELECT DISTINCT "level", true FROM (SELECT "level" FROM "ranking_versions" UNION SELECT "level" FROM "titles") AS "used" ON CONFLICT DO NOTHING;
