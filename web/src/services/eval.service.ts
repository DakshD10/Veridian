import { prisma } from "@/lib/prisma";
import { callModel } from "@/services/model.service";

const METRICS = [
  "answer_relevancy",
  "hallucination",
  "faithfulness",
  "correctness",
] as const;

const TEST_RESULT_PASS_THRESHOLD = 0.75;
const METRIC_PASS_THRESHOLD = 0.5;

interface ModelResult {
  testCaseId: string;
  actualOutput: string;
  latencyMs: number;
}

interface ScoredResult {
  id: string;
  passed: boolean;
  scores: Record<string, number>;
  reasons: Record<string, string>;
  overall_score: number;
}

interface EvalEngineResponse {
  results: ScoredResult[];
}

export async function startEvalRun(
  suiteId: string,
  modelId: string,
  modelVersion?: string,
  existingRunId?: string
) {
  const evalRun = existingRunId
    ? await prisma.evalRun.findUnique({
        where: { id: existingRunId },
        select: { id: true },
      })
    : await prisma.evalRun.create({
        data: {
          suiteId,
          modelId,
          modelVersion,
          status: "PENDING",
        },
        select: { id: true },
      });

  if (!evalRun) {
    throw new Error("Eval run not found");
  }

  try {
    const testCases = await prisma.testCase.findMany({
      where: { suiteId },
      orderBy: { createdAt: "asc" },
    });

    await prisma.evalRun.update({
      where: { id: evalRun.id },
      data: { status: "RUNNING" },
    });

    if (testCases.length === 0) {
      return await prisma.evalRun.update({
        where: { id: evalRun.id },
        data: {
          status: "COMPLETED",
          overallScore: 0,
          passedCount: 0,
          failedCount: 0,
          completedAt: new Date(),
        },
        include: {
          results: {
            include: {
              testCase: true,
              metricScores: true,
            },
          },
        },
      });
    }

    const modelResults: ModelResult[] = [];

    for (const testCase of testCases) {
      const { output, latencyMs } = await callModel(
        modelId,
        testCase.input,
        testCase.context ?? undefined
      );

      modelResults.push({
        testCaseId: testCase.id,
        actualOutput: output,
        latencyMs,
      });
    }

    const evalEngineUrl = process.env.EVAL_ENGINE_URL;
    if (!evalEngineUrl) {
      throw new Error("EVAL_ENGINE_URL environment variable is not set");
    }

    const modelResultsByTestCaseId = new Map(
      modelResults.map((result) => [result.testCaseId, result] as const)
    );

    const requestBody = {
      test_cases: testCases.map((testCase: (typeof testCases)[number]) => {
        const modelResult = modelResultsByTestCaseId.get(testCase.id);

        if (!modelResult) {
          throw new Error(`Missing model output for test case ${testCase.id}`);
        }

        return {
          id: testCase.id,
          input: testCase.input,
          expected_output: testCase.expectedOutput,
          context: testCase.context,
          actual_output: modelResult.actualOutput,
        };
      }),
      metrics: METRICS,
    };

    const response = await fetch(`${evalEngineUrl.replace(/\/$/, "")}/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Eval engine returned status ${response.status}: ${response.statusText}`
      );
    }

    const scoredResults = (await response.json()) as EvalEngineResponse;
    const scoredResultsById = new Map(
      scoredResults.results.map((result) => [result.id, result] as const)
    );

    if (scoredResults.results.length !== testCases.length) {
      throw new Error(
        `Eval engine returned ${scoredResults.results.length} results for ${testCases.length} test cases`
      );
    }

    const testResults: Array<{ overallScore: number; passed: boolean }> =
      await prisma.$transaction(async (tx) => {
      const createdResults: Array<{
        overallScore: number;
        passed: boolean;
      }> = [];
      const txUnsafe = tx as unknown as {
        testResult: {
          create: (args: {
            data: {
              runId: string;
              testCaseId: string;
              modelOutput: string;
              scores: Record<string, number>;
              reasons: Record<string, string>;
              overallScore: number;
              passed: boolean;
              latencyMs: number;
            };
          }) => Promise<{ id: string; overallScore: number; passed: boolean }>;
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

      for (const testCase of testCases) {
        const scoredResult = scoredResultsById.get(testCase.id);
        const modelResult = modelResultsByTestCaseId.get(testCase.id);

        if (!scoredResult) {
          throw new Error(`Missing scored result for test case ${testCase.id}`);
        }

        if (!modelResult) {
          throw new Error(`Missing model result for test case ${testCase.id}`);
        }

        const testResult = await txUnsafe.testResult.create({
          data: {
            runId: evalRun.id,
            testCaseId: testCase.id,
            modelOutput: modelResult.actualOutput,
            scores: scoredResult.scores,
            reasons: scoredResult.reasons,
            overallScore: scoredResult.overall_score,
            passed: scoredResult.overall_score >= TEST_RESULT_PASS_THRESHOLD,
            latencyMs: modelResult.latencyMs,
          },
        });

        await txUnsafe.metricScore.createMany({
          data: METRICS.map((metricName) => ({
            testResultId: testResult.id,
            metricName,
            score: scoredResult.scores[metricName] ?? 0,
            passed: (scoredResult.scores[metricName] ?? 0) >= METRIC_PASS_THRESHOLD,
            reason: scoredResult.reasons[metricName] ?? null,
          })),
        });

        createdResults.push(testResult);
      }

        return createdResults;
      });

    const overallScore =
      testResults.length === 0
        ? 0
        : testResults.reduce(
            (sum: number, testResult) => sum + testResult.overallScore,
            0
          ) /
          testResults.length;
    const passedCount = testResults.filter((testResult) => testResult.passed).length;
    const failedCount = testResults.length - passedCount;

    return await prisma.evalRun.update({
      where: { id: evalRun.id },
      data: {
        status: "COMPLETED",
        overallScore,
        passedCount,
        failedCount,
        completedAt: new Date(),
      },
      include: {
        results: {
          include: {
            testCase: true,
            metricScores: true,
          },
        },
      },
    });
  } catch (error) {
    await prisma.evalRun.update({
      where: { id: evalRun.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
