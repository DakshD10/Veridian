import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateDeploymentSchema = z.object({
  name: z.string().min(1, "name is required"),
  suiteId: z.string().min(1, "suiteId is required"),
  currentModel: z.string().min(1, "currentModel is required"),
  threshold: z.number().min(0).max(1).optional(),
  description: z.string().optional(),
  slackWebhookUrl: z.string().url().optional(),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(_request: NextRequest) {
  try {
    const deployments = await prisma.watchedDeployment.findMany({
      include: {
        suite: {
          select: {
            name: true,
          },
        },
        agentRuns: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(deployments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateDeploymentSchema.parse(body);

    const suite = await prisma.evalSuite.findUnique({
      where: { id: data.suiteId },
      select: { id: true },
    });

    if (!suite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    const deployment = await prisma.watchedDeployment.create({
      data: {
        name: data.name,
        suiteId: data.suiteId,
        currentModel: data.currentModel,
        threshold: data.threshold,
        description: data.description,
        slackWebhookUrl: data.slackWebhookUrl,
      },
    });

    return NextResponse.json(deployment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
