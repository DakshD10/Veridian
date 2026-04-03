import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ListRedTeamRunsQuerySchema = z.object({
  suiteId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  status: z.enum(["running", "completed", "error"]).optional(),
  limit: z
    .preprocess(
      (value) => (typeof value === "string" && value.length > 0 ? Number(value) : 30),
      z.number().int().min(1).max(100)
    )
    .default(30),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(request: NextRequest) {
  try {
    const query = ListRedTeamRunsQuerySchema.parse({
      suiteId: request.nextUrl.searchParams.get("suiteId") ?? undefined,
      modelId: request.nextUrl.searchParams.get("modelId") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const runs = await prisma.redTeamRun.findMany({
      where: {
        suiteId: query.suiteId,
        modelId: query.modelId,
        status: query.status,
      },
      include: {
        suite: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: query.limit,
    });

    return NextResponse.json(runs, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
