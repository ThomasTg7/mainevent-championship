CREATE TYPE "public"."bout_corner" AS ENUM('red', 'blue');--> statement-breakpoint
ALTER TABLE "bouts" ADD COLUMN "champion_corner" "bout_corner" DEFAULT 'red' NOT NULL;