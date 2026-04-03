import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CreateProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  modelId: z.string().min(1, "Model ID is required"),
  apiKey: z.string().optional(),
  description: z.string().optional(),
  providerType: z
    .enum([
      "openai-compatible",
      "ollama",
      "vllm",
      "litellm",
      "huggingface",
      "azure",
      "together",
    ])
    .default("openai-compatible"),
});

export async function GET() {
  try {
    const providers = await prisma.customProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(providers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CreateProviderSchema.parse(body);

    const provider = await prisma.customProvider.create({
      data: {
        name: data.name,
        baseUrl: data.baseUrl,
        modelId: data.modelId,
        apiKey: data.apiKey ?? null,
        description: data.description ?? null,
        providerType: data.providerType,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
