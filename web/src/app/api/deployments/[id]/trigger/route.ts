import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { triggerAgentRun } from "@/services/agent.service";

const ParamsSchema = z.object({
  id: z.string().min(1, "id is required"),
});

const TriggerBodySchema = z.object({
  newModelId: z.string().min(1, "newModelId is required"),
  triggerEvent: z.string().min(1, "triggerEvent is required"),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = TriggerBodySchema.parse(body);

    const existing = await prisma.watchedDeployment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    const result = await triggerAgentRun(id, data.newModelId, data.triggerEvent);

    await prisma.watchedDeployment.update({
      where: { id },
      data: {
        currentModel: data.newModelId,
      },
    });

    return NextResponse.json({ agentRunId: result.agentRunId }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
