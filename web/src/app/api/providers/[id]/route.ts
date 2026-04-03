import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateProviderSchema = z.object({
  name: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  modelId: z.string().min(1).optional(),
  apiKey: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  providerType: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = UpdateProviderSchema.parse(body);

    // If baseUrl or modelId changed, reset test status
    // because the connection needs to be re-verified
    const resetTestFields =
      data.baseUrl !== undefined || data.modelId !== undefined
        ? { lastTestOk: false, lastTestedAt: null, lastLatencyMs: null }
        : {};

    const provider = await prisma.customProvider.update({
      where: { id },
      data: { ...data, ...resetTestFields },
    });

    return NextResponse.json(provider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Soft delete — never hard delete because runs may reference this provider
    await prisma.customProvider.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}
