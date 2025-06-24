-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "voucherBatchId" INTEGER;

-- CreateTable
CREATE TABLE "VoucherBatch" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchSize" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "VoucherBatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_voucherBatchId_fkey" FOREIGN KEY ("voucherBatchId") REFERENCES "VoucherBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
