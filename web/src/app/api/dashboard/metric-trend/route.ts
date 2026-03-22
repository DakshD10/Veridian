import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_METRICS = [
  "answer_relevancy",
  "hallucination",
  "faithfulness",
  "correctness",
] as const;

type MetricName = (typeof VALID_METRICS)[number];

export async function GET(request: NextRequest) {
  try {
    const suiteId = request.nextUrl.searchParams.get("suiteId") ?? undefined;
    const metricParam = request.nextUrl.searchParams.get("metric") ?? undefined;
    const daysParam = request.nextUrl.searchParams.get("days");

    const days = daysParam ? Number(daysParam) : 30;
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json(
        { error: "Invalid days parameter" },
        { status: 400 }
      );
    }

    if (
      metricParam &&
      !VALID_METRICS.includes(metricParam as MetricName)
    ) {
      return NextResponse.json(
        { error: "Invalid metric parameter" },
        { status: 400 }
      );
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metricScores = await prisma.metricScore.findMany({
      where: {
        metricName: metricParam,
        createdAt: { gte: since },
        testResult: {
          run: {
            status: "COMPLETED",
            suiteId,
          },
        },
      },
      select: {
        metricName: true,
        score: true,
        createdAt: true,
        testResult: {
          select: {
            run: {
              select: {
                modelId: true,
                suiteId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const trend = metricScores.map((row) => ({
      date: row.createdAt.toISOString().slice(0, 10),
      metricName: row.metricName,
      score: row.score,
      modelId: row.testResult.run.modelId,
      suiteId: row.testResult.run.suiteId,
    }));

    return NextResponse.json(trend, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metric trend" },
      { status: 500 }
    );
  }
}
