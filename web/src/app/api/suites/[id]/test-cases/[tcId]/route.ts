import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Suite id is required"),
  tcId: z.string().min(1, "Test case id is required"),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; tcId: string }> }
) {
  try {
    const { id, tcId } = ParamsSchema.parse(await context.params);

    const testCase = await prisma.testCase.findUnique({
      where: { id: tcId },
      select: {
        id: true,
        suiteId: true,
      },
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    if (testCase.suiteId !== id) {
      return NextResponse.json(
        { error: "Test case does not belong to suite" },
        { status: 400 }
      );
    }

    const { deletedResultCount, affectedRunCount } = await prisma.$transaction(
      async (tx) => {
        const relatedResults = await tx.testResult.findMany({
          where: { testCaseId: tcId },
          select: { runId: true },
          distinct: ["runId"],
        });

        const runIds = relatedResults.map((result) => result.runId);

        const deleteResults = await tx.testResult.deleteMany({
          where: { testCaseId: tcId },
        });

        await tx.testCase.delete({
          where: { id: tcId },
        });

        for (const runId of runIds) {
          const [remainingResultCount, passedCount, average] = await Promise.all([
            tx.testResult.count({ where: { runId } }),
            tx.testResult.count({ where: { runId, passed: true } }),
            tx.testResult.aggregate({
              where: { runId },
              _avg: { overallScore: true },
            }),
          ]);

          await tx.evalRun.update({
            where: { id: runId },
            data: {
              overallScore: average._avg.overallScore ?? 0,
              passedCount,
              failedCount: remainingResultCount - passedCount,
            },
          });
        }

        return {
          deletedResultCount: deleteResults.count,
          affectedRunCount: runIds.length,
        };
      }
    );

    return NextResponse.json(
      { ok: true, deletedResultCount, affectedRunCount },
      { status: 200 }
    );
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
