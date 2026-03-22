import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Agent run id is required"),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await context.params);

    const agentRun = await prisma.agentRun.findUnique({
      where: { id },
      include: {
        deployment: {
          select: {
            id: true,
            name: true,
            currentModel: true,
            threshold: true,
          },
        },
        evalRun: {
          select: {
            id: true,
            modelId: true,
            overallScore: true,
            status: true,
          },
        },
      },
    });

    if (!agentRun) {
      return NextResponse.json(
        { error: "Agent run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(agentRun);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
