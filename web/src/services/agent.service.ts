import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const TEST_RESULT_PASS_THRESHOLD = 0.75;
const METRIC_PASS_THRESHOLD = 0.5;

type SeverityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type ParsedScoredResult = {
  id: string;
  passed: boolean;
  scores: Record<string, number>;
  reasons: Record<string, string>;
  severity?: SeverityLabel;
  overallScore: number;
};

type ParsedTestResult = {
  id: string;
  actualOutput: string;
  latencyMs?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumericRecord(value: unknown): Record<string, number> {
  const record = asRecord(value);
  if (!record) return {};

  const parsed: Record<string, number> = {};
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      parsed[key] = raw;
    }
  }
  return parsed;
}

function toStringRecord(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};

  const parsed: Record<string, string> = {};
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === "string") {
      parsed[key] = raw;
    }
  }
  return parsed;
}

function parseSeverity(value: unknown): SeverityLabel | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase();
  if (normalized === "CRITICAL") return "CRITICAL";
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "MEDIUM") return "MEDIUM";
  if (normalized === "LOW") return "LOW";
  return undefined;
}

function parseScoredResults(value: unknown): ParsedScoredResult[] {
  if (!Array.isArray(value)) return [];

  const parsed: ParsedScoredResult[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row || typeof row.id !== "string") continue;

    const overallRaw =
      typeof row.overall_score === "number"
        ? row.overall_score
        : typeof row.overallScore === "number"
          ? row.overallScore
          : 0;

    const overallScore = Number.isFinite(overallRaw) ? overallRaw : 0;
    const passed =
      typeof row.passed === "boolean"
        ? row.passed
        : overallScore >= TEST_RESULT_PASS_THRESHOLD;

    parsed.push({
      id: row.id,
      passed,
      scores: toNumericRecord(row.scores),
      reasons: toStringRecord(row.reasons),
      severity: parseSeverity(row.severity),
      overallScore,
    });
  }

  return parsed;
}

function parseTestResults(value: unknown): ParsedTestResult[] {
  if (!Array.isArray(value)) return [];

  const parsed: ParsedTestResult[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row || typeof row.id !== "string") continue;

    const actualOutput =
      typeof row.actual_output === "string"
        ? row.actual_output
        : typeof row.actualOutput === "string"
          ? row.actualOutput
          : "";

    const latencyRaw =
      typeof row.latency_ms === "number"
        ? row.latency_ms
        : typeof row.latencyMs === "number"
          ? row.latencyMs
          : undefined;

    parsed.push({
      id: row.id,
      actualOutput,
      latencyMs: typeof latencyRaw === "number" && Number.isFinite(latencyRaw)
        ? Math.max(0, Math.round(latencyRaw))
        : undefined,
    });
  }

  return parsed;
}

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
    select: {
      status: true,
      triggerSource: true,
      evalRunId: true,
      deployment: {
        select: {
          suiteId: true,
          currentModel: true,
        },
      },
    },
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

  const scoredResults = parseScoredResults(
    resultObj.scored_results ?? resultObj.scoredResults
  );
  const testResults = parseTestResults(
    resultObj.test_results ?? resultObj.testResults
  );
  const testResultById = new Map(testResults.map((row) => [row.id, row] as const));

  const requestedModelId =
    typeof resultObj.new_model_id === "string"
      ? resultObj.new_model_id
      : typeof resultObj.newModelId === "string"
        ? resultObj.newModelId
        : existing.deployment.currentModel;

  if (!existing.evalRunId && scoredResults.length > 0) {
    const passedCount = scoredResults.filter((row) => row.passed).length;
    const failedCount = scoredResults.length - passedCount;
    const overallScore =
      scoredResults.reduce((sum, row) => sum + row.overallScore, 0) /
      Math.max(scoredResults.length, 1);

    const createdEvalRun = await prisma.$transaction(async (tx) => {
      const run = await tx.evalRun.create({
        data: {
          suiteId: existing.deployment.suiteId,
          modelId: requestedModelId,
          status: "COMPLETED",
          triggeredBy: existing.triggerSource || "agent",
          overallScore,
          passedCount,
          failedCount,
          completedAt: new Date(),
          evalMode: "standard",
        },
        select: { id: true },
      });

      const txUnsafe = tx as unknown as {
        testResult: {
          create: (args: {
            data: {
              runId: string;
              testCaseId: string;
              modelOutput: string;
              scores: Record<string, number>;
              reasons: Record<string, string>;
              severity?: SeverityLabel;
              overallScore: number;
              passed: boolean;
              latencyMs?: number;
            };
          }) => Promise<{ id: string }>;
        };
        metricScore: {
          createMany: (args: {
            data: Array<{
              testResultId: string;
              metricName: string;
              score: number;
              passed: boolean;
              reason: string | null;
            }>;
          }) => Promise<unknown>;
        };
      };

      for (const row of scoredResults) {
        const matchingTest = testResultById.get(row.id);
        const createdTestResult = await txUnsafe.testResult.create({
          data: {
            runId: run.id,
            testCaseId: row.id,
            modelOutput: matchingTest?.actualOutput ?? "",
            scores: row.scores,
            reasons: row.reasons,
            severity: row.severity,
            overallScore: row.overallScore,
            passed: row.passed,
            latencyMs: matchingTest?.latencyMs,
          },
        });

        const metricRows = Object.entries(row.scores).map(([metricName, score]) => ({
          testResultId: createdTestResult.id,
          metricName,
          score,
          passed: score >= METRIC_PASS_THRESHOLD,
          reason: row.reasons[metricName] ?? null,
        }));

        if (metricRows.length > 0) {
          await txUnsafe.metricScore.createMany({ data: metricRows });
        }
      }

      return run;
    });

    data.evalRunId = createdEvalRun.id;
  }

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
  
  await prisma.agentRun.update({
    where: { id: agentRunId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
  });

  return { success: true };
}
