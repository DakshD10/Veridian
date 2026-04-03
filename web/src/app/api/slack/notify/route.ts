import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildRegressionBlocks,
  sendSlackMessage,
  sendSlackFile,
} from "@/services/slack.service";
import { generateComplianceReport } from "@/services/report.service";

const NotifySchema = z.object({
  channelId: z.string().min(1),
  agentRunId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, agentRunId } = NotifySchema.parse(body);

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

    const blocks = buildRegressionBlocks({
      id: agentRun.id,
      deployment: agentRun.deployment,
      decision: agentRun.decision,
      previousScore: agentRun.previousScore,
      newScore: agentRun.newScore,
      regressionFound: agentRun.regressionFound,
      rootCause: agentRun.rootCause,
    });

    await sendSlackMessage(channelId, blocks);

    if (agentRun.evalRunId) {
      try {
        const pdfBuffer = await generateComplianceReport(agentRun.evalRunId);
        await sendSlackFile(
          channelId,
          Buffer.from(pdfBuffer),
          `veridian-report-${agentRun.id.slice(0, 8)}.pdf`
        );
      } catch (pdfErr) {
        console.error("[slack notify] PDF generation/send failed:", pdfErr);
      }
    }

    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: { slackNotified: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[slack notify]", error);
    return NextResponse.json(
      { error: "Failed to send Slack notification" },
      { status: 500 }
    );
  }
}
