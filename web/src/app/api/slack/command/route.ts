import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifySlackSignature,
  parseSlashCommand,
  sendSlackText,
  sendSlackMessage,
  buildDeploymentPickerBlocks,
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
      ? `Preparing eval run for *${args}* in a thread...`
      : "Opening deployment picker in a thread...";
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
      if (subcommand === "check" && !args) {
        const deployments = await prisma.watchedDeployment.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        if (deployments.length === 0) {
          await sendSlackText(channelId, "No active deployments found to check.");
          return;
        }

        const parent = await sendSlackText(
          channelId,
          `🧵 <@${userId}> requested deployment check. Continue in thread.`
        );

        const threadTs = parent.ts;
        if (!threadTs) {
          await sendSlackText(
            channelId,
            "Failed to open thread. Please try again in a moment."
          );
          return;
        }

        await sendSlackMessage(
          channelId,
          buildDeploymentPickerBlocks(deployments, userId),
          {
            text: "Pick a deployment to run an evaluation",
            threadTs,
          }
        );
        return;
      }

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

        const parent = await sendSlackText(
          channelId,
          `🧵 <@${userId}> requested eval for *${deployment.name}*. Updates in thread.`
        );

        const threadTs = parent.ts;
        await prisma.watchedDeployment.update({
          where: { id: deployment.id },
          data: { slackChannelId: channelId },
        });

        if (threadTs) {
          await sendSlackText(
            channelId,
            `Running Veridian eval on *${deployment.name}*... I'll post results here when done.`,
            { threadTs }
          );
        }

        await triggerAgentRun(
          deployment.id,
          deployment.currentModel,
          `Slack command from ${userId} in ${channelId}${threadTs ? ` [thread_ts:${threadTs}]` : ""}`,
          "slack"
        );
        return;
      }

      if (subcommand === "status") {
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
    response_type: "ephemeral",
    text: immediateResponse,
  });
}
