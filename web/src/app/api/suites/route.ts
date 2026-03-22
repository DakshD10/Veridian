import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateSuiteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  domain: z.string().optional(),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function GET(_request: NextRequest) {
  try {
    const suites = await prisma.evalSuite.findMany({
      include: {
        _count: {
          select: {
            testCases: true,
            runs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(suites, { status: 200 });
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
    const data = CreateSuiteSchema.parse(body);

    const suite = await prisma.evalSuite.create({
      data: {
        name: data.name,
        description: data.description,
        domain: data.domain,
      },
    });

    return NextResponse.json(suite, { status: 201 });
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
