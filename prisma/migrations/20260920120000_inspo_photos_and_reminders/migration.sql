-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "inspoImages" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

