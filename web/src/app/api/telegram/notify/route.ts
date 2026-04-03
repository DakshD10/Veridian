import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildResultMessage,
  sendMessage,
  sendDocument,
} from "@/services/telegram.service";
import { generateComplianceReport } from "@/services/report.service";

const NotifySchema = z.object({
  chatId: z.string().min(1),
  agentRunId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, agentRunId } = NotifySchema.parse(body);

    const agentRun = await prisma.agentRun.findUnique({
      where: { id: agentRunId },
      include: {
        deployment: true,
        evalRun: true,
      },
    });

    if (!agentRun) {
      return NextResponse.json({ error: "Agent run not found" }, { status: 404 });
    }

    const message = buildResultMessage({
      deployment: agentRun.deployment,
      decision: agentRun.decision,
      previousScore: agentRun.previousScore,
      newScore: agentRun.newScore,
      regressionFound: agentRun.regressionFound,
      rootCause: agentRun.rootCause,
    }, !!agentRun.evalRunId);

    await sendMessage(chatId, message);

    if (agentRun.evalRunId) {
      try {
        const pdfBuffer = await generateComplianceReport(agentRun.evalRunId);
        const caption = agentRun.regressionFound
          ? "⚠️ Veridian Regression Report"
          : "✅ Veridian Eval Report";

        await sendDocument(
          chatId,
          Buffer.from(pdfBuffer),
          `veridian-report-${agentRun.id.slice(0, 8)}.pdf`,
          caption
        );
      } catch (pdfErr) {
        console.error("[telegram notify] PDF generation/send failed:", pdfErr);
      }
    }

    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: { telegramNotified: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[telegram notify]", error);
    return NextResponse.json(
      { error: "Failed to send Telegram notification" },
      { status: 500 }
    );
  }
}
