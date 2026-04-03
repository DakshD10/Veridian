/*
  Warnings:

  - You are about to drop the column `rootCause` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `telegramNotified` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `triggerSource` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `evalMode` on the `EvalRun` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `TestResult` table. All the data in the column will be lost.
  - You are about to drop the column `slackChannelId` on the `WatchedDeployment` table. All the data in the column will be lost.
  - You are about to drop the column `telegramChatId` on the `WatchedDeployment` table. All the data in the column will be lost.
  - You are about to drop the `CustomProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RedTeamRun` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RedTeamRun" DROP CONSTRAINT "RedTeamRun_suiteId_fkey";

-- AlterTable
ALTER TABLE "AgentRun" DROP COLUMN "rootCause",
DROP COLUMN "telegramNotified",
DROP COLUMN "triggerSource";

-- AlterTable
ALTER TABLE "EvalRun" DROP COLUMN "evalMode";

-- AlterTable
ALTER TABLE "TestResult" DROP COLUMN "severity";

-- AlterTable
ALTER TABLE "WatchedDeployment" DROP COLUMN "slackChannelId",
DROP COLUMN "telegramChatId",
ADD COLUMN     "slackWebhookUrl" TEXT;

-- DropTable
DROP TABLE "CustomProvider";

-- DropTable
DROP TABLE "RedTeamRun";
