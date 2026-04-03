import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTestSuite } from "@/services/suiteGenerator.service";

const GenerateSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters"),
  domain: z.enum(["healthcare", "bfsi", "hiring", "general"]).optional(),
  count: z.number().int().min(1).max(20).optional().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = GenerateSchema.parse(body);

    const result = await generateTestSuite(
      data.description,
      data.domain,
      data.count
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suite" },
      { status: 500 }
    );
  }
}
