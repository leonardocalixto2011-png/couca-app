CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "serviceSlug" TEXT,
    "wantedDate" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "notifiedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Waitlist_notifiedAt_idx" ON "Waitlist"("notifiedAt");
