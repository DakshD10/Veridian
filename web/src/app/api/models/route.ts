import { NextResponse } from "next/server";
import { getAvailableModels } from "@/services/model.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // getAvailableModels is now async — it fetches custom providers from DB
    const models = await getAvailableModels();
    return NextResponse.json(models);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
