import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildRegressionBlocks,
  sendSlackMessage,
  sendSlackFile,
  sendSlackText,
} from "@/services/slack.service";
import { generateComplianceReport } from "@/services/report.service";

const NotifySchema = z.object({
  channelId: z.string().min(1),
  agentRunId: z.string().min(1),
});

function extractThreadTs(triggerEvent: string | null): string | undefined {
  if (!triggerEvent) return undefined;
  const match = triggerEvent.match(/\[thread_ts:([^\]]+)\]/);
  return match?.[1];
}

function extractChannelIdFromTriggerEvent(
  triggerEvent: string | null
): string | undefined {
  if (!triggerEvent) return undefined;
  // Expected shape includes "... in C123ABC456 [thread_ts:...]"
  const match = triggerEvent.match(/\sin\s([CDG][A-Z0-9]+)(?:\s|$)/);
  return match?.[1];
}

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

    const threadTs = extractThreadTs(agentRun.triggerEvent);
    const triggerChannelId =
      agentRun.triggerSource === "slack"
        ? extractChannelIdFromTriggerEvent(agentRun.triggerEvent)
        : undefined;
    const effectiveChannelId = triggerChannelId ?? channelId;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const reportUrl =
      agentRun.evalRunId && appBaseUrl
        ? `${appBaseUrl}/api/runs/${agentRun.evalRunId}/report`
        : undefined;

    const blocks = buildRegressionBlocks({
      id: agentRun.id,
      deployment: agentRun.deployment,
      decision: agentRun.decision,
      previousScore: agentRun.previousScore,
      newScore: agentRun.newScore,
      regressionFound: agentRun.regressionFound,
      rootCause: agentRun.rootCause,
    });

    await sendSlackMessage(effectiveChannelId, blocks, {
      text: "Veridian evaluation completed",
      threadTs,
    });

    if (agentRun.evalRunId) {
      try {
        const pdfBuffer = await generateComplianceReport(agentRun.evalRunId);
        let fileResult = await sendSlackFile(
          effectiveChannelId,
          Buffer.from(pdfBuffer),
          `veridian-report-${agentRun.id.slice(0, 8)}.pdf`,
          { threadTs }
        );
        if (!fileResult.ok && fileResult.error === "invalid_arguments") {
          // One more attempt with conservative args (no thread + shorter filename).
          fileResult = await sendSlackFile(
            effectiveChannelId,
            Buffer.from(pdfBuffer),
            `report-${agentRun.id.slice(0, 8)}.pdf`
          );
        }
        if (!fileResult.ok) {
          const suffix = fileResult.error ? ` (\`${fileResult.error}\`)` : "";
          const details = fileResult.details ? ` Details: ${fileResult.details}` : "";
          const reportSuffix = reportUrl ? ` Direct report: ${reportUrl}` : "";
          await sendSlackText(
            effectiveChannelId,
            `Report PDF could not be uploaded${suffix}.${details}${reportSuffix} Check Slack bot file scopes and reinstall the app.`,
            threadTs ? { threadTs } : undefined
          );
        }
      } catch (pdfErr) {
        console.error("[slack notify] PDF generation/send failed:", pdfErr);
        await sendSlackText(
          effectiveChannelId,
          "Report PDF generation/upload failed. Check server logs for `[slack notify] PDF generation/send failed`.",
          threadTs ? { threadTs } : undefined
        );
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
