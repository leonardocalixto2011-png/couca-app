ALTER TABLE "Customer" ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referralCreditCents" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "Customer_referralCode_key" ON "Customer"("referralCode");

ALTER TABLE "Booking" ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referralDiscountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralRewardedAt" TIMESTAMP(3);
