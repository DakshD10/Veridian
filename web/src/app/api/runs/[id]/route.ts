import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Run id is required"),
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

    const run = await prisma.evalRun.findUnique({
      where: { id },
      include: {
        suite: true,
        results: {
          include: {
            metricScores: {
              select: {
                id: true,
                testResultId: true,
                metricName: true,
                score: true,
                passed: true,
                reason: true,
                createdAt: true,
              },
              orderBy: {
                metricName: "asc",
              },
            },
            testCase: {
              select: {
                id: true,
                input: true,
                expectedOutput: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(run, { status: 200 });
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
