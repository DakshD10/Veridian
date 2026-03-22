import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ModelComparisonQuerySchema = z.object({
  suiteId: z.string().min(1, "suiteId is required"),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(request: NextRequest) {
  try {
    const query = ModelComparisonQuerySchema.parse({
      suiteId: request.nextUrl.searchParams.get("suiteId") ?? undefined,
    });

    const groupedRuns = await prisma.evalRun.groupBy({
      by: ["modelId"],
      where: {
        suiteId: query.suiteId,
        status: "COMPLETED",
        overallScore: { not: null },
      },
      _avg: {
        overallScore: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        modelId: "asc",
      },
    });

    const comparison = groupedRuns.map((row: (typeof groupedRuns)[number]) => ({
      modelId: row.modelId,
      avgScore: row._avg.overallScore ?? 0,
      runCount: row._count._all,
    }));

    return NextResponse.json(comparison, { status: 200 });
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
