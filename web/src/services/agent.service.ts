import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function triggerAgentRun(
  deploymentId: string,
  newModelId: string,
  triggerEvent: string,
  triggerSource: string = "manual"
) {
  const deployment = await prisma.watchedDeployment.findUnique({
    where: { id: deploymentId },
    include: {
      suite: {
        include: {
          testCases: true,
        },
      },
    },
  });

  if (!deployment) {
    throw new Error("Watched deployment not found");
  }

  // Get the full deployment with slackWebhookUrl
  const fullDeployment = await prisma.watchedDeployment.findUnique({
    where: { id: deploymentId },
    select: {
      slackWebhookUrl: true,
      slackChannelId: true,
      telegramChatId: true,
    },
  });

  const lastCompletedRun = await prisma.evalRun.findFirst({
    where: {
      suiteId: deployment.suiteId,
      status: "COMPLETED",
    },
    orderBy: {
      completedAt: "desc",
    },
    select: {
      overallScore: true,
    },
  });

  const previousScore = lastCompletedRun?.overallScore ?? 0;

  const agentRun = await prisma.agentRun.create({
    data: {
      deploymentId,
      triggerEvent,
      triggerSource,
      previousScore,
      status: "running",
    },
  });

  const callbackUrl =
    process.env.NEXT_PUBLIC_APP_URL +
    "/api/agent-runs/" +
    agentRun.id +
    "/result";

  const payload = {
    agent_run_id: agentRun.id,
    deployment_id: deployment.id,
    trigger_event: triggerEvent,
    trigger_source: triggerSource,
    new_model_id: newModelId,
    previous_score: previousScore,
    threshold: deployment.threshold,
    callback_url: callbackUrl,
    slack_webhook_url: fullDeployment?.slackWebhookUrl,
  slack_channel_id: fullDeployment?.slackChannelId,
  telegram_chat_id: fullDeployment?.telegramChatId,
    eval_suite: {
      id: deployment.suite.id,
      name: deployment.suite.name,
      description: deployment.suite.description,
      domain: deployment.suite.domain,
      version: deployment.suite.version,
      test_cases: deployment.suite.testCases.map(
        (testCase: {
          id: string;
          input: string;
          expectedOutput: string;
          context: string | null;
        }) => ({
          id: testCase.id,
          input: testCase.input,
          expected_output: testCase.expectedOutput,
          context: testCase.context,
        })
      ),
    },
  };

  const evalEngineUrl = process.env.EVAL_ENGINE_URL;

  void fetch(`${evalEngineUrl}/agent/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error("[agent.service] Failed to start async agent run:", error);
  });

  return { agentRunId: agentRun.id };
}

export async function updateAgentRunResult(agentRunId: string, result: unknown) {
  const resultObj = (result ?? {}) as Record<string, unknown>;

  const existing = await prisma.agentRun.findUnique({
    where: { id: agentRunId },
    select: { status: true },
  });

  if (!existing) {
    throw new Error("Agent run not found");
  }

  if (existing.status === "completed") {
    throw new Error("DUPLICATE");
  }

  const data: {
    status: string;
    newScore?: number;
    previousScore?: number;
    regressionFound?: boolean;
    decision?: string;
    reportSummary?: string;
    rootCause?: string | null;
    agentTrace?: Prisma.JsonValue;
    evalRunId?: string;
    slackNotified?: boolean;
    telegramNotified?: boolean;
  } = {
    status: "completed",
  };

  if (typeof resultObj.new_score === "number") data.newScore = resultObj.new_score;
  if (typeof resultObj.newScore === "number") data.newScore = resultObj.newScore;

  if (typeof resultObj.previous_score === "number") {
    data.previousScore = resultObj.previous_score;
  }
  if (typeof resultObj.previousScore === "number") {
    data.previousScore = resultObj.previousScore;
  }

  if (typeof resultObj.regression_found === "boolean") {
    data.regressionFound = resultObj.regression_found;
  }
  if (typeof resultObj.regressionFound === "boolean") {
    data.regressionFound = resultObj.regressionFound;
  }

  if (typeof resultObj.decision === "string") data.decision = resultObj.decision;

  if (typeof resultObj.report_summary === "string") {
    data.reportSummary = resultObj.report_summary;
  }
  if (typeof resultObj.reportSummary === "string") {
    data.reportSummary = resultObj.reportSummary;
  }

  if (typeof resultObj.root_cause === "string") {
    data.rootCause = resultObj.root_cause;
  }
  if (typeof resultObj.rootCause === "string") {
    data.rootCause = resultObj.rootCause;
  }

  if (resultObj.agent_trace !== undefined) data.agentTrace = resultObj.agent_trace as Prisma.JsonValue;
  if (resultObj.agentTrace !== undefined) data.agentTrace = resultObj.agentTrace as Prisma.JsonValue;

  // evalRunId is not updatable, so we skip it

  if (typeof resultObj.slack_notified === "boolean") {
    data.slackNotified = resultObj.slack_notified;
  }
  if (typeof resultObj.slackNotified === "boolean") {
    data.slackNotified = resultObj.slackNotified;
  }

  if (typeof resultObj.telegram_notified === "boolean") {
    data.telegramNotified = resultObj.telegram_notified;
  }
  if (typeof resultObj.telegramNotified === "boolean") {
    data.telegramNotified = resultObj.telegramNotified;
  }

  // Remove evalRunId from data since it's not updatable
  const updateData = { ...data };
  delete updateData.evalRunId;
  
  await prisma.agentRun.update({
    where: { id: agentRunId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: updateData as any,
  });

  return { success: true };
}
