/*
  Warnings:

  - You are about to drop the `Dataset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrainingJob" DROP CONSTRAINT "TrainingJob_datasetId_fkey";

-- DropTable
DROP TABLE "Dataset";

-- DropTable
DROP TABLE "TrainingJob";
