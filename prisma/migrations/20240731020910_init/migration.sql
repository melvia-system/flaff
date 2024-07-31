-- CreateTable
CREATE TABLE "Flaff" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ownerLink" TEXT NOT NULL,
    "ownerPassword" TEXT,
    "guestLink" TEXT NOT NULL,
    "guestPassword" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "File" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "flaffUuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "File_flaffUuid_fkey" FOREIGN KEY ("flaffUuid") REFERENCES "Flaff" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
