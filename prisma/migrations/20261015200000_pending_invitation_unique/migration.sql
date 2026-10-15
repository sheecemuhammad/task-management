-- Ensure at most one pending invitation per team+email
CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvitation_teamId_email_pending_key"
ON "TeamInvitation" ("teamId", "email")
WHERE "acceptedAt" IS NULL;
