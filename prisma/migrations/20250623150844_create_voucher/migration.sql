-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "expiry" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiryDays" INTEGER NOT NULL DEFAULT 0;
