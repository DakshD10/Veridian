import { NextRequest, NextResponse } from "next/server";
import { updateAgentRunResult } from "@/services/agent.service";
import { z } from "zod";

const ResultSchema = z.object({
  agent_run_id:     z.string(),
  new_score:        z.number(),
  previous_score:   z.number(),
  regression_found: z.boolean(),
  decision:         z.string(),
  report_summary:   z.string(),
  agent_trace:      z.array(z.any()),
  scored_results:   z.array(z.any()),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await req.json();
    const data = ResultSchema.parse(body);

    await updateAgentRunResult(id, data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Error && error.message === "Agent run not found") {
      return NextResponse.json({ error: "Agent run not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "DUPLICATE") {
      return NextResponse.json(
        { message: "Already completed — idempotent duplicate ignored" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    );
  }
}
