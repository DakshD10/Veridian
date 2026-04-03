import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function toNullableJsonInput(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return Prisma.JsonNull;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function triggerRedTeamRun(suiteId: string, modelId: string) {
  const suite = await prisma.evalSuite.findUnique({
    where: { id: suiteId },
    include: { testCases: true },
  });

  if (!suite) {
    throw new Error("Suite not found");
  }
  if (suite.testCases.length === 0) {
    throw new Error("Suite has no test cases");
  }

  const redTeamRun = await prisma.redTeamRun.create({
    data: {
      suiteId,
      modelId,
      status: "running",
    },
    select: { id: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL not configured");
  }
  const evalEngineUrl = process.env.EVAL_ENGINE_URL ?? "http://localhost:3001";
  const callbackUrl = `${appUrl}/api/red-team-runs/${redTeamRun.id}/result`;

  void fetch(`${evalEngineUrl.replace(/\/$/, "")}/red-team/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      red_team_run_id: redTeamRun.id,
      suite_id: suiteId,
      model_id: modelId,
      callback_url: callbackUrl,
      test_cases: suite.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expected_output: tc.expectedOutput,
        context: tc.context ?? null,
      })),
    }),
  }).catch((err) => {
    console.error("[redTeam.service] Failed to start async red team run:", err);
  });

  return { redTeamRunId: redTeamRun.id };
}

interface RedTeamResultPayload {
  findings: unknown[];
  critical_count: number;
  attacks_generated: number;
  attacks_succeeded: number;
  report_summary: string;
  agent_trace: unknown[];
}

export async function updateRedTeamResult(
  redTeamRunId: string,
  result: RedTeamResultPayload
) {
  const existing = await prisma.redTeamRun.findUnique({
    where: { id: redTeamRunId },
    select: { status: true },
  });

  if (!existing) {
    throw new Error("Red team run not found");
  }

  if (existing.status === "completed") {
    throw new Error("DUPLICATE");
  }

  await prisma.redTeamRun.update({
    where: { id: redTeamRunId },
    data: {
      findings: toNullableJsonInput(result.findings),
      criticalFindings: result.critical_count,
      attacksGenerated: result.attacks_generated,
      attacksSucceeded: result.attacks_succeeded,
      reportSummary: result.report_summary,
      agentTrace: toNullableJsonInput(result.agent_trace),
      status: "completed",
      completedAt: new Date(),
    },
  });

  return { success: true };
}
