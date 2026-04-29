-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "source" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT NOT NULL,
    "device" TEXT,
    "country" TEXT,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_sessionId_idx" ON "page_views"("sessionId");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");
