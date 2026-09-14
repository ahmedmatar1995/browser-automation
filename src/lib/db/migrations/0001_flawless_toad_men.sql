ALTER TABLE "workflows" ADD COLUMN "orgId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "org_id";