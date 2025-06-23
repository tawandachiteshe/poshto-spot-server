-- CreateTable
CREATE TABLE "Voucher" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "dataCapBytes" BIGINT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timeCapSeconds" INTEGER NOT NULL DEFAULT 3600,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");
