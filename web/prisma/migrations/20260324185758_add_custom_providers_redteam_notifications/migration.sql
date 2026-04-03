-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN     "rootCause" TEXT,
ADD COLUMN     "telegramNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "triggerSource" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "EvalRun" ADD COLUMN     "evalMode" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "WatchedDeployment" ADD COLUMN     "slackChannelId" TEXT,
ADD COLUMN     "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "CustomProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT,
    "modelId" TEXT NOT NULL,
    "description" TEXT,
    "providerType" TEXT NOT NULL DEFAULT 'openai-compatible',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestOk" BOOLEAN NOT NULL DEFAULT false,
    "lastLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedTeamRun" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "attacksGenerated" INTEGER NOT NULL DEFAULT 0,
    "attacksSucceeded" INTEGER NOT NULL DEFAULT 0,
    "criticalFindings" INTEGER NOT NULL DEFAULT 0,
    "reportSummary" TEXT,
    "findings" JSONB,
    "agentTrace" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RedTeamRun_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RedTeamRun" ADD CONSTRAINT "RedTeamRun_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "EvalSuite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
