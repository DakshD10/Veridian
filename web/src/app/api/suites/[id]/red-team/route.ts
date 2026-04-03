import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { triggerRedTeamRun } from "@/services/redTeam.service";

const TriggerSchema = z.object({
  modelId: z.string().min(1, "Model ID is required"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { modelId } = TriggerSchema.parse(body);
    const { id: suiteId } = await context.params;

    const redTeamRun = await triggerRedTeamRun(suiteId, modelId);

    return NextResponse.json({ redTeamRunId: redTeamRun.redTeamRunId }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Suite not found") {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Suite has no test cases") {
      return NextResponse.json({ error: "Suite has no test cases" }, { status: 400 });
    }
    console.error("[red-team trigger]", error);
    return NextResponse.json(
      { error: "Failed to start red team run" },
      { status: 500 }
    );
  }
}
