import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifySlackSignature,
  parseSlashCommand,
  sendSlackText,
} from "@/services/slack.service";
import { triggerAgentRun } from "@/services/agent.service";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const isValid = await verifySlackSignature(req, rawBody);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const text = params.get("text") ?? "";
  const channelId = params.get("channel_id") ?? "";
  const userId = params.get("user_id") ?? "";

  const { subcommand, args } = parseSlashCommand(text);
  let immediateResponse = "";

  if (subcommand === "check") {
    immediateResponse = args
      ? `Running Veridian eval on *${args}*... I'll post results here when done.`
      : "Please provide a deployment name. Example: `/veridian check triage-ai`";
  } else if (subcommand === "status") {
    immediateResponse = "Fetching deployment status...";
  } else if (subcommand === "help") {
    immediateResponse =
      "Veridian Slash Commands\n" +
      "/veridian check [deployment-name] — Run eval on a deployment\n" +
      "/veridian status — Show last run for all deployments\n" +
      "/veridian help — Show this message";
  } else {
    immediateResponse = `Unknown command: ${text}. Try /veridian help.`;
  }

  setImmediate(async () => {
    try {
      if (subcommand === "check" && args) {
        const deployment = await prisma.watchedDeployment.findFirst({
          where: {
            name: { equals: args, mode: "insensitive" },
            isActive: true,
          },
        });

        if (!deployment) {
          await sendSlackText(
            channelId,
            `Deployment not found: *${args}*. Use \`/veridian status\` to list deployments.`
          );
          return;
        }

        await prisma.watchedDeployment.update({
          where: { id: deployment.id },
          data: { slackChannelId: channelId },
        });

        await triggerAgentRun(
          deployment.id,
          deployment.currentModel,
          `Slack command from ${userId}`,
          "slack"
        );
      } else if (subcommand === "status") {
        const deployments = await prisma.watchedDeployment.findMany({
          where: { isActive: true },
          include: {
            agentRuns: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          take: 5,
        });

        if (deployments.length === 0) {
          await sendSlackText(channelId, "No active deployments found.");
          return;
        }

        const statusLines = deployments.map((d) => {
          const lastRun = d.agentRuns[0];
          const score = lastRun?.newScore?.toFixed(2) ?? "no runs";
          const badge = lastRun?.decision === "FAIL" ? "❌" : "✅";
          return `${badge} *${d.name}* — Score: ${score}`;
        });

        await sendSlackText(
          channelId,
          `*Veridian Deployment Status*\n${statusLines.join("\n")}`
        );
      }
    } catch (err) {
      console.error("[slack command background]", err);
      await sendSlackText(channelId, "An error occurred processing your command.").catch(
        () => {}
      );
    }
  });

  return NextResponse.json({
    response_type: "in_channel",
    text: immediateResponse,
  });
}