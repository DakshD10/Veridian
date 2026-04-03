import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET() {
  try {
    const totalSuites = await prisma.evalSuite.count();
    const totalRuns = await prisma.evalRun.count();
    const regressionsCaught = await prisma.agentRun.count({
      where: { regressionFound: true },
    });
    const avgResult = await prisma.evalRun.aggregate({
      where: { status: "COMPLETED" },
      _avg: { overallScore: true },
    });

    return NextResponse.json(
      {
        totalSuites,
        totalRuns,
        regressionsCaught,
        avgScore: avgResult._avg.overallScore ?? 0,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
