ALTER TABLE "artists" RENAME COLUMN "account_id" TO "handle";--> statement-breakpoint
ALTER TABLE "artists" DROP CONSTRAINT "artists_account_id_unique";--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_handle_unique" UNIQUE("handle");