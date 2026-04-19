import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerAgentRun } from "@/services/agent.service";
import { sendSlackText, verifySlackSignature } from "@/services/slack.service";

type SlackActionPayload = {
  type?: string;
  user?: { id?: string };
  channel?: { id?: string };
  message?: { ts?: string; thread_ts?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const isValid = await verifySlackSignature(req, rawBody);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");
  if (!payloadRaw) {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  let payload: SlackActionPayload;
  try {
    payload = JSON.parse(payloadRaw) as SlackActionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
  }

  const action = payload.actions?.[0];
  const actionId = action?.action_id;
  const deploymentId = action?.value;
  const channelId = payload.channel?.id;
  const userId = payload.user?.id;
  const threadTs = payload.message?.thread_ts ?? payload.message?.ts;

  if (payload.type !== "block_actions" || actionId !== "run_deployment_eval" || !deploymentId || !channelId || !userId) {
    return NextResponse.json({ ok: true });
  }

  setImmediate(async () => {
    try {
      const deployment = await prisma.watchedDeployment.findUnique({
        where: { id: deploymentId },
      });

      if (!deployment || !deployment.isActive) {
        await sendSlackText(
          channelId,
          "Deployment not found or inactive.",
          threadTs ? { threadTs } : undefined
        );
        return;
      }

      await prisma.watchedDeployment.update({
        where: { id: deployment.id },
        data: { slackChannelId: channelId },
      });

      await sendSlackText(
        channelId,
        `Running Veridian eval on *${deployment.name}*... I'll post results here when done.`,
        threadTs ? { threadTs } : undefined
      );

      await triggerAgentRun(
        deployment.id,
        deployment.currentModel,
        `Slack button click from ${userId} in ${channelId}${threadTs ? ` [thread_ts:${threadTs}]` : ""}`,
        "slack"
      );
    } catch (error) {
      console.error("[slack actions background]", error);
      await sendSlackText(
        channelId,
        "Failed to start eval run. Please try again.",
        threadTs ? { threadTs } : undefined
      ).catch(() => {});
    }
  });

  return NextResponse.json({
    response_action: "clear",
  });
}
