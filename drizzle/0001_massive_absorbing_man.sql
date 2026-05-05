ALTER TABLE "events" RENAME COLUMN "importance" TO "type";--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "budget";--> statement-breakpoint
DROP TYPE "public"."importance";