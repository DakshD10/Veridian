import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { testProviderConnection } from "@/services/model.service";

const TestConnectionSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  modelId: z.string().min(1, "Model ID is required"),
  apiKey: z.string().nullable().optional(),
  providerId: z.string().optional(), // If present, update DB record on success
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = TestConnectionSchema.parse(body);

    const result = await testProviderConnection(
      data.baseUrl,
      data.modelId,
      data.apiKey ?? undefined
    );

    // If test passed and providerId given, update the DB record
    if (result.ok && data.providerId) {
      await prisma.customProvider.update({
        where: { id: data.providerId },
        data: {
          lastTestOk: true,
          lastTestedAt: new Date(),
          lastLatencyMs: result.latencyMs ?? null,
        },
      });
    }

    // If test failed and providerId given, mark as failed in DB
    if (!result.ok && data.providerId) {
      await prisma.customProvider.update({
        where: { id: data.providerId },
        data: {
          lastTestOk: false,
          lastTestedAt: new Date(),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to test connection" },
      { status: 500 }
    );
  }
}
