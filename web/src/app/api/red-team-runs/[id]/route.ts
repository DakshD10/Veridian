import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const run = await prisma.redTeamRun.findUnique({
      where: { id },
      include: {
        suite: {
          select: { id: true, name: true, domain: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Red team run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch red team run" },
      { status: 500 }
    );
  }
}
