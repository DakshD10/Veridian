import { NextResponse } from "next/server";
import { getAvailableModels } from "@/services/model.service";

export async function GET() {
  try {
    return NextResponse.json(getAvailableModels());
  } catch {
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
