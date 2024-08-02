-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "flaffUuid" TEXT NOT NULL,
    "fileId" TEXT,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "File_flaffUuid_fkey" FOREIGN KEY ("flaffUuid") REFERENCES "Flaff" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "File_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("uuid") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("createdAt", "extension", "flaffUuid", "mimeType", "name", "size", "type", "updatedAt", "uuid") SELECT "createdAt", "extension", "flaffUuid", "mimeType", "name", "size", "type", "updatedAt", "uuid" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
