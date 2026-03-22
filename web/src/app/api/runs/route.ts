import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { startEvalRun } from "@/services/eval.service";

const ListRunsQuerySchema = z.object({
  suiteId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]).optional(),
  limit: z
    .preprocess(
      (value) => (typeof value === "string" && value.length > 0 ? Number(value) : 20),
      z.number().int().min(1).max(100)
    )
    .default(20),
});

const StartRunBodySchema = z.object({
  suiteId: z.string().min(1, "suiteId is required"),
  modelId: z.string().min(1, "modelId is required"),
  modelVersion: z.string().optional(),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(request: NextRequest) {
  try {
    const query = ListRunsQuerySchema.parse({
      suiteId: request.nextUrl.searchParams.get("suiteId") ?? undefined,
      modelId: request.nextUrl.searchParams.get("modelId") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const runs = await prisma.evalRun.findMany({
      where: {
        suiteId: query.suiteId,
        modelId: query.modelId,
        status: query.status,
      },
      include: {
        suite: {
          select: {
            name: true,
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

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = StartRunBodySchema.parse(body);

    const suite = await prisma.evalSuite.findUnique({
      where: { id: data.suiteId },
      select: { id: true },
    });

    if (!suite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    const run = await prisma.evalRun.create({
      data: {
        suiteId: data.suiteId,
        modelId: data.modelId,
        modelVersion: data.modelVersion,
        status: "PENDING",
      },
      select: { id: true },
    });

    void startEvalRun(data.suiteId, data.modelId, data.modelVersion, run.id).catch(
      (error) => {
        console.error("[runs.route] startEvalRun failed:", error);
      }
    );

    return NextResponse.json({ runId: run.id }, { status: 202 });
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
