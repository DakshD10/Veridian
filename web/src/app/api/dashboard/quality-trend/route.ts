import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const QualityTrendQuerySchema = z.object({
  suiteId: z.string().min(1, "suiteId is required").optional(),
  days: z
    .preprocess(
      (value) => (typeof value === "string" && value.length > 0 ? Number(value) : 30),
      z.number().int().min(1).max(365)
    )
    .default(30),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(request: NextRequest) {
  try {
    const query = QualityTrendQuerySchema.parse({
      suiteId: request.nextUrl.searchParams.get("suiteId") ?? undefined,
      days: request.nextUrl.searchParams.get("days") ?? undefined,
    });

    const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

    const runs = await prisma.evalRun.findMany({
      where: {
        ...(query.suiteId ? { suiteId: query.suiteId } : {}),
        status: "COMPLETED",
        overallScore: { not: null },
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        overallScore: true,
        modelId: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const trend = runs.map((run: (typeof runs)[number]) => ({
      date: run.createdAt.toISOString(),
      score: run.overallScore ?? 0,
      modelId: run.modelId,
    }));

    return NextResponse.json(trend, { status: 200 });
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
