import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateRedTeamResult } from "@/services/redTeam.service";

const VulnerabilitySchema = z.object({
  attack_type: z.string(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  description: z.string(),
  input: z.string().optional(),
  output: z.string().optional(),
  original_test_case_id: z.string().optional(),
});

const ResultSchema = z.object({
  red_team_run_id: z.string(),
  findings: z.array(VulnerabilitySchema),
  critical_count: z.number().int(),
  attacks_generated: z.number().int(),
  attacks_succeeded: z.number().int(),
  report_summary: z.string(),
  agent_trace: z.array(z.any()),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();
    const data = ResultSchema.parse(body);

    await updateRedTeamResult(id, data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Red team run not found") {
      return NextResponse.json(
        { error: "Red team run not found" },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === "DUPLICATE") {
      return NextResponse.json(
        { error: "Red team run already completed" },
        { status: 409 }
      );
    }
    console.error("[red-team result callback]", error);
    return NextResponse.json(
      { error: "Failed to update red team run" },
      { status: 500 }
    );
  }
}
