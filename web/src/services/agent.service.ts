import { prisma } from "@/lib/prisma";

export async function triggerAgentRun(
  deploymentId: string,
  newModelId: string,
  triggerEvent: string
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
    new_model_id: newModelId,
    previous_score: previousScore,
    threshold: deployment.threshold,
    callback_url: callbackUrl,
    slack_webhook_url: deployment.slackWebhookUrl,
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

export async function updateAgentRunResult(agentRunId: string, result: any) {
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
    agentTrace?: unknown;
    evalRunId?: string;
    slackNotified?: boolean;
  } = {
    status: "completed",
  };

  if (typeof result.new_score === "number") data.newScore = result.new_score;
  if (typeof result.newScore === "number") data.newScore = result.newScore;

  if (typeof result.previous_score === "number") {
    data.previousScore = result.previous_score;
  }
  if (typeof result.previousScore === "number") {
    data.previousScore = result.previousScore;
  }

  if (typeof result.regression_found === "boolean") {
    data.regressionFound = result.regression_found;
  }
  if (typeof result.regressionFound === "boolean") {
    data.regressionFound = result.regressionFound;
  }

  if (typeof result.decision === "string") data.decision = result.decision;

  if (typeof result.report_summary === "string") {
    data.reportSummary = result.report_summary;
  }
  if (typeof result.reportSummary === "string") {
    data.reportSummary = result.reportSummary;
  }

  if (result.agent_trace !== undefined) data.agentTrace = result.agent_trace;
  if (result.agentTrace !== undefined) data.agentTrace = result.agentTrace;

  if (typeof result.eval_run_id === "string") data.evalRunId = result.eval_run_id;
  if (typeof result.evalRunId === "string") data.evalRunId = result.evalRunId;

  if (typeof result.slack_notified === "boolean") {
    data.slackNotified = result.slack_notified;
  }
  if (typeof result.slackNotified === "boolean") {
    data.slackNotified = result.slackNotified;
  }

  await prisma.agentRun.update({
    where: { id: agentRunId },
    data,
  });

  return { success: true };
}
