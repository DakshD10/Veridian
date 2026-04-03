type TelegramReplyMarkup = Record<string, unknown>;

export async function sendMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram] sendMessage failed:", data.description);
    }
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
  }
}

export async function sendDocument(
  chatId: string | number,
  pdfBuffer: Buffer,
  filename: string,
  caption: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append(
      "document",
      new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
      filename
    );
    formData.append("caption", caption);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram] sendDocument failed:", data.description);
    }
  } catch (err) {
    console.error("[telegram] sendDocument error:", err);
  }
}

export async function setWebhook(webhookUrl: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — webhook not set");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log("[telegram] Webhook set:", webhookUrl);
    } else {
      console.error("[telegram] setWebhook failed:", data.description);
    }
  } catch (err) {
    console.error("[telegram] setWebhook error:", err);
  }
}

export function parseCommand(text: string): {
  command: string;
  args: string;
} {
  const trimmed = (text ?? "").trim();
  const match = trimmed.match(/^\/(\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  if (!match) return { command: "unknown", args: "" };

  return {
    command: match[1].toLowerCase(),
    args: (match[2] ?? "").trim(),
  };
}

interface AgentRunResult {
  deployment: { name: string };
  decision: string | null;
  previousScore: number | null;
  newScore: number | null;
  regressionFound: boolean;
  rootCause: string | null;
}

export function buildResultMessage(agentRun: AgentRunResult, hasPdf: boolean = true): string {
  const decisionEmoji = agentRun.regressionFound ? "❌" : "✅";
  const prevScore = agentRun.previousScore?.toFixed(2) ?? "N/A";
  const newScore = agentRun.newScore?.toFixed(2) ?? "N/A";
  const scoreChange =
    agentRun.previousScore != null && agentRun.newScore != null
      ? `${prevScore} → ${newScore}`
      : newScore;

  let message = "*Veridian Eval Complete*\n\n";
  message += `Deployment: ${agentRun.deployment.name}\n`;
  message += `Decision: ${decisionEmoji} ${agentRun.decision ?? "UNKNOWN"}\n`;
  message += `Score: ${scoreChange}\n`;

  if (agentRun.rootCause && agentRun.regressionFound) {
    const truncated = agentRun.rootCause.slice(0, 200);
    message += `Root Cause: ${truncated}${agentRun.rootCause.length > 200 ? "..." : ""}\n`;
  }

  if (hasPdf) {
    message += "\nPDF report attached below.";
  }
  return message;
}
