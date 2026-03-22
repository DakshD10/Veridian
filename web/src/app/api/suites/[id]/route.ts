import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Suite id is required"),
});

const UpdateSuiteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  domain: z.string().optional(),
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

    const suite = await prisma.evalSuite.findUnique({
      where: { id },
      include: {
        testCases: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!suite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    return NextResponse.json(suite, { status: 200 });
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
    const data = UpdateSuiteSchema.parse(body);

    const existingSuite = await prisma.evalSuite.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingSuite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    const suite = await prisma.evalSuite.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        domain: data.domain,
      },
    });

    return NextResponse.json(suite, { status: 200 });
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

    const existingSuite = await prisma.evalSuite.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingSuite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    await prisma.evalSuite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
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
