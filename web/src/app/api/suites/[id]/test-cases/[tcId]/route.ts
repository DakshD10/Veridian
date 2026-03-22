import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ParamsSchema = z.object({
  id: z.string().min(1, "Suite id is required"),
  tcId: z.string().min(1, "Test case id is required"),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; tcId: string }> }
) {
  try {
    const { id, tcId } = ParamsSchema.parse(await context.params);

    const testCase = await prisma.testCase.findUnique({
      where: { id: tcId },
      select: {
        id: true,
        suiteId: true,
      },
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    if (testCase.suiteId !== id) {
      return NextResponse.json(
        { error: "Test case does not belong to suite" },
        { status: 400 }
      );
    }

    await prisma.testCase.delete({
      where: { id: tcId },
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
