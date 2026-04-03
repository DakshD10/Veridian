import { prisma } from "@/lib/prisma";
import { callModel } from "@/services/model.service";
import axios, { AxiosError } from "axios";

const DEFAULT_METRICS = [
  "answer_relevancy",
  "hallucination",
  "faithfulness",
  "correctness",
] as const;

type EvalMode = "standard" | "rigorous" | "brutal";
type MetricName = (typeof DEFAULT_METRICS)[number] | "consistency";

function getMetricsForEvalMode(evalMode: EvalMode): MetricName[] {
  if (evalMode === "rigorous" || evalMode === "brutal") {
    return [...DEFAULT_METRICS, "consistency"];
  }
  return [...DEFAULT_METRICS];
}

const TEST_RESULT_PASS_THRESHOLD = 0.75;
const METRIC_PASS_THRESHOLD = 0.5;

interface ModelResult {
  testCaseId: string;
  actualOutput: string;
  latencyMs: number;
  consistencyOutputs?: string[];
  boundaryOutput?: string;
}

interface ScoredResult {
  id: string;
  passed: boolean;
  scores: Record<string, number>;
  reasons: Record<string, string>;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  overall_score: number;
}

interface EvalEngineResponse {
  results: ScoredResult[];
}

const DEFAULT_EVAL_ENGINE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_EVAL_ENGINE_MAX_RETRIES = 2;
const DEFAULT_EVAL_ENGINE_RETRY_DELAY_MS = 2000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractEvalEngineErrorMessage(error: AxiosError): string {
  if (error.response) {
    const status = error.response.status;
    const statusText = error.response.statusText;
    const data = error.response.data as
      | { detail?: string; error?: string }
      | string
      | undefined;

    if (typeof data === "string" && data.trim().length > 0) {
      return `Eval engine returned ${status} ${statusText}: ${data}`;
    }
    if (data && typeof data === "object") {
      const detail = data.detail ?? data.error;
      if (detail) {
        return `Eval engine returned ${status} ${statusText}: ${detail}`;
      }
    }
    return `Eval engine returned ${status} ${statusText}`;
  }

  if (error.code === "ECONNABORTED") {
    return "Eval engine request timed out. Increase EVAL_ENGINE_TIMEOUT_MS or reduce suite size/eval intensity.";
  }

  if (error.message) {
    return `Eval engine request failed: ${error.message}`;
  }

  return "Eval engine request failed";
}

function isRetryableAxiosError(error: AxiosError): boolean {
  if (!error.response) {
    return true; // network/timeout-level failures
  }

  const status = error.response.status;
  return status >= 500 || status === 429;
}

async function postEvaluateWithRetry(
  evalEngineUrl: string,
  requestBody: unknown
): Promise<EvalEngineResponse> {
  const timeoutMs = parsePositiveInt(
    process.env.EVAL_ENGINE_TIMEOUT_MS,
    DEFAULT_EVAL_ENGINE_TIMEOUT_MS
  );
  const maxRetries = parsePositiveInt(
    process.env.EVAL_ENGINE_MAX_RETRIES,
    DEFAULT_EVAL_ENGINE_MAX_RETRIES
  );
  const retryDelayMs = parsePositiveInt(
    process.env.EVAL_ENGINE_RETRY_DELAY_MS,
    DEFAULT_EVAL_ENGINE_RETRY_DELAY_MS
  );

  const baseUrl = evalEngineUrl.replace(/\/$/, "");
  const endpoints = [`${baseUrl}/evaluate`];
  try {
    const parsed = new URL(baseUrl);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      const ipv4Endpoint = `${parsed.toString().replace(/\/$/, "")}/evaluate`;
      if (!endpoints.includes(ipv4Endpoint)) {
        endpoints.push(ipv4Endpoint);
      }
    }
  } catch {
    // Keep the original endpoint only when URL parsing fails.
  }

  let lastError: AxiosError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex += 1) {
      const endpoint = endpoints[endpointIndex];

      try {
        const response = await axios.post<EvalEngineResponse>(endpoint, requestBody, {
          headers: { "Content-Type": "application/json" },
          timeout: timeoutMs,
        });
        return response.data;
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          throw error;
        }

        lastError = error;

        const hasMoreEndpoints = endpointIndex < endpoints.length - 1;
        const hasMoreAttempts = attempt < maxRetries;
        const shouldRetry = isRetryableAxiosError(error) && (hasMoreEndpoints || hasMoreAttempts);
        if (!shouldRetry) {
          throw new Error(extractEvalEngineErrorMessage(error));
        }

        if (hasMoreEndpoints) {
          continue;
        }
      }
    }

    const backoffMs = retryDelayMs * (attempt + 1);
    await sleep(backoffMs);
  }

  if (lastError) {
    throw new Error(extractEvalEngineErrorMessage(lastError));
  }

  throw new Error("Eval engine request failed after retries");
}

function buildBoundaryCasePrompt(input: string): string {
  return `Boundary-case variant: ${input}

Answer conservatively and explicitly flag uncertainty where assumptions are required.`;
}

export async function startEvalRun(
  suiteId: string,
  modelId: string,
  modelVersion?: string,
  evalMode: EvalMode = "standard",
  existingRunId?: string
) {
  const metrics = getMetricsForEvalMode(evalMode);

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
          evalMode,
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
      if (evalMode === "standard") {
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
        continue;
      }

      // Rigorous/Brutal: run 3 stability passes for consistency analysis.
      const consistencyPasses: Array<{ output: string; latencyMs: number }> = [];
      for (let i = 0; i < 3; i += 1) {
        const pass = await callModel(
          modelId,
          testCase.input,
          testCase.context ?? undefined
        );
        consistencyPasses.push(pass);
      }

      let boundaryOutput: string | undefined;
      if (evalMode === "brutal") {
        const boundaryPrompt = buildBoundaryCasePrompt(testCase.input);
        const boundary = await callModel(
          modelId,
          boundaryPrompt,
          testCase.context ?? undefined
        );
        boundaryOutput = boundary.output;
      }

      const avgLatencyMs = Math.round(
        consistencyPasses.reduce((sum, pass) => sum + pass.latencyMs, 0) /
          Math.max(consistencyPasses.length, 1)
      );

      modelResults.push({
        testCaseId: testCase.id,
        actualOutput: consistencyPasses[0]?.output ?? "",
        latencyMs: avgLatencyMs,
        consistencyOutputs: consistencyPasses.map((pass) => pass.output),
        boundaryOutput,
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
          consistency_outputs: modelResult.consistencyOutputs ?? null,
          boundary_output: modelResult.boundaryOutput ?? null,
        };
      }),
      metrics,
      eval_mode: evalMode,
    };

    const scoredResults = await postEvaluateWithRetry(evalEngineUrl, requestBody);
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
              severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
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
            severity: scoredResult.severity,
            overallScore: scoredResult.overall_score,
            passed: scoredResult.overall_score >= TEST_RESULT_PASS_THRESHOLD,
            latencyMs: modelResult.latencyMs,
          },
        });

        await txUnsafe.metricScore.createMany({
          data: metrics.map((metricName) => ({
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
