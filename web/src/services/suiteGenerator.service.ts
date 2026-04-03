import { z } from "zod";

const GeneratedCaseSchema = z.object({
  input: z.string().min(1),
  expected_output: z.string().min(1),
  context: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const GenerateResponseSchema = z.object({
  test_cases: z.array(GeneratedCaseSchema),
  domain: z.string(),
  generated_count: z.number().int(),
});

export async function generateTestSuite(
  description: string,
  domain?: "healthcare" | "bfsi" | "hiring" | "general",
  count: number = 10
) {
  const evalEngineUrl = process.env.EVAL_ENGINE_URL;
  if (!evalEngineUrl) {
    throw new Error("EVAL_ENGINE_URL not configured");
  }

  const response = await fetch(`${evalEngineUrl.replace(/\/$/, "")}/suite/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      domain: domain ?? null,
      count,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail ?? `Generation failed with status ${response.status}`);
  }

  const payload = await response.json();
  return GenerateResponseSchema.parse(payload);
}

