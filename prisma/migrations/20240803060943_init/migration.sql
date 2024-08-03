-- CreateTable
CREATE TABLE "Flaff" (
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerLink" TEXT NOT NULL,
    "ownerPassword" TEXT,
    "guestLink" TEXT NOT NULL,
    "guestPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flaff_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "File" (
    "uuid" TEXT NOT NULL,
    "flaffUuid" TEXT NOT NULL,
    "fileId" TEXT,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_flaffUuid_fkey" FOREIGN KEY ("flaffUuid") REFERENCES "Flaff"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
