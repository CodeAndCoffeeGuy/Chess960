-- CreateTable
CREATE TABLE "BetaEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "BetaEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaEmail_email_key" ON "BetaEmail"("email");
