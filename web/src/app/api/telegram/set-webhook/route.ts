import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setWebhook } from "@/services/telegram.service";

const SetWebhookSchema = z.object({
  webhookUrl: z.string().url("Must be a valid HTTPS URL"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webhookUrl } = SetWebhookSchema.parse(body);
    await setWebhook(webhookUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 500 });
  }
}
