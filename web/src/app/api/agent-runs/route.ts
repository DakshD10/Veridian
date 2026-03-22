import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agentRuns = await prisma.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        deployment: {
          select: { id: true, name: true, currentModel: true },
        },
      },
    });
    return NextResponse.json(agentRuns);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch agent runs" },
      { status: 500 }
    );
  }
}
