import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCommand, sendMessage } from "@/services/telegram.service";
import { triggerAgentRun } from "@/services/agent.service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;
  const callbackQuery = body.callback_query;

  if (!message?.text && !callbackQuery) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message?.chat?.id ?? callbackQuery?.message?.chat?.id ?? "");
  const text = message?.text ?? "";

  setImmediate(async () => {
    try {
      // Handle Callback Queries (Button Clicks)
      if (callbackQuery) {
        const data = callbackQuery.data; // e.g. "run_eval:clwy..."
        if (data.startsWith("run_eval:")) {
          const deploymentId = data.replace("run_eval:", "");
          const deployment = await prisma.watchedDeployment.findUnique({
            where: { id: deploymentId },
          });

          if (!deployment) {
            await sendMessage(chatId, "Deployment not found.");
            return;
          }

          await prisma.watchedDeployment.update({
            where: { id: deployment.id },
            data: { telegramChatId: chatId },
          });

          await sendMessage(
            chatId,
            `Running Veridian eval on *${deployment.name}*... You'll receive the report when done.`
          );

          await triggerAgentRun(
            deployment.id,
            deployment.currentModel,
            `Telegram button click from chat ${chatId}`,
            "telegram"
          );
        }
        return;
      }

      const { command, args } = parseCommand(text);

      if (command === "check") {
        const activeDeployments = await prisma.watchedDeployment.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        });

        const replyMarkup = {
          inline_keyboard: activeDeployments.map((d) => [
            { text: `🚀 Run ${d.name}`, callback_data: `run_eval:${d.id}` },
          ]),
        };

        if (!args) {
          if (activeDeployments.length === 0) {
            await sendMessage(chatId, "No active deployments found to check.");
          } else {
            await sendMessage(
              chatId,
              "Tap a deployment below to run an evaluation:",
              replyMarkup
            );
          }
          return;
        }

        const deployment = await prisma.watchedDeployment.findFirst({
          where: {
            name: { equals: args, mode: "insensitive" },
            isActive: true,
          },
        });

        if (!deployment) {
          await sendMessage(
            chatId,
            `Deployment not found: *${args}*\n\nTry tapping one of these instead:`,
            replyMarkup
          );
          return;
        }

        await prisma.watchedDeployment.update({
          where: { id: deployment.id },
          data: { telegramChatId: chatId },
        });

        await sendMessage(
          chatId,
          `Running Veridian eval on *${deployment.name}*... You'll receive the report when done.`
        );

        await triggerAgentRun(
          deployment.id,
          deployment.currentModel,
          `Telegram command from chat ${chatId}`,
          "telegram"
        );
      } else if (command === "status") {
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
          await sendMessage(chatId, "No active deployments found.");
          return;
        }

        const lines = deployments.map((d) => {
          const lastRun = d.agentRuns[0];
          const score = lastRun?.newScore?.toFixed(2) ?? "no runs";
          const badge = lastRun?.decision === "FAIL" ? "❌" : "✅";
          return `${badge} *${d.name}* — ${score}`;
        });

        await sendMessage(chatId, `*Veridian Status*\n${lines.join("\n")}`);
      } else if (command === "suites") {
        const suites = await prisma.evalSuite.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            name: true,
            domain: true,
            _count: { select: { testCases: true } },
          },
        });

        const lines = suites.map(
          (s) =>
            `• *${s.name}* — ${s.domain ?? "general"} — ${s._count.testCases} cases`
        );

        await sendMessage(
          chatId,
          lines.length > 0
            ? `*Eval Suites*\n${lines.join("\n")}`
            : "No eval suites found."
        );
      } else if (command === "runs") {
        const runs = await prisma.evalRun.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { suite: { select: { name: true } } },
        });

        if (runs.length === 0) {
          await sendMessage(chatId, "No recent runs found.");
          return;
        }

        const lines = runs.map((r) => {
          const score = r.overallScore?.toFixed(2) ?? (r.status === "PENDING" || r.status === "RUNNING" ? "⏳" : "N/A");
          const status = r.status === "COMPLETED" ? "✅" : r.status === "FAILED" ? "❌" : "⏳";
          return `${status} *${r.suite.name}* — ${score}`;
        });

        await sendMessage(chatId, `*Recent Eval Runs*\n${lines.join("\n")}`);
      } else if (command === "help" || command === "start") {
        await sendMessage(
          chatId,
          "*Veridian Bot Commands*\n" +
            "/check [deployment-name] — Run eval on a deployment\n" +
            "/status — Show last run for all deployments\n" +
            "/suites — List eval suites\n" +
            "/runs — List recent eval runs\n" +
            "/help — Show this message"
        );
      } else {
        await sendMessage(chatId, "Unknown command. Type /help to see available commands.");
      }
    } catch (err) {
      console.error("[telegram webhook background]", err);
      await sendMessage(chatId, "An error occurred. Please try again.").catch(() => {});
    }
  });

  return NextResponse.json({ ok: true });
}
