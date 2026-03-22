import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Deployment id is required"),
});

const UpdateDeploymentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  currentModel: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  slackWebhookUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean().optional(),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await context.params);

    const deployment = await prisma.watchedDeployment.findUnique({
      where: { id },
      include: {
        suite: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        agentRuns: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            triggerEvent: true,
            previousScore: true,
            newScore: true,
            regressionFound: true,
            decision: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    return NextResponse.json(deployment, { status: 200 });
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = UpdateDeploymentSchema.parse(body);

    const existing = await prisma.watchedDeployment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    const updated = await prisma.watchedDeployment.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        currentModel: data.currentModel,
        threshold: data.threshold,
        slackWebhookUrl:
          data.slackWebhookUrl === "" ? null : data.slackWebhookUrl,
        isActive: data.isActive,
      },
      include: {
        suite: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        agentRuns: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            triggerEvent: true,
            previousScore: true,
            newScore: true,
            regressionFound: true,
            decision: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
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

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await context.params);

    await prisma.watchedDeployment.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
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
