/*
  Warnings:

  - You are about to drop the column `teamId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_teamId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "teamId";

-- CreateTable
CREATE TABLE "_AssignedProjects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AssignedProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AssignedProjects_B_index" ON "_AssignedProjects"("B");

-- AddForeignKey
ALTER TABLE "_AssignedProjects" ADD CONSTRAINT "_AssignedProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignedProjects" ADD CONSTRAINT "_AssignedProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
