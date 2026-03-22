import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Suite id is required"),
});

const CreateTestCaseSchema = z.object({
  input: z.string().min(1, "Input is required"),
  expectedOutput: z.string().min(1, "Expected output is required"),
  context: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = CreateTestCaseSchema.parse(body);

    const suite = await prisma.evalSuite.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!suite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    const testCase = await prisma.testCase.create({
      data: {
        suiteId: id,
        input: data.input,
        expectedOutput: data.expectedOutput,
        context: data.context,
        tags: data.tags ?? [],
      },
    });

    return NextResponse.json(testCase, { status: 201 });
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
