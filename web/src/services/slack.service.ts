import crypto from "crypto";
import type { NextRequest } from "next/server";

export async function verifySlackSignature(
  req: NextRequest,
  rawBody: string
): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn("[slack] SLACK_SIGNING_SECRET not set — skipping verification");
    return false;
  }

  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");
  if (!timestamp || !signature) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number.parseInt(timestamp, 10)) > 300) return false;

  const baseString = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto
    .createHmac("sha256", signingSecret)
    .update(baseString)
    .digest("hex");
  const expected = `v0=${hmac}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function sendSlackMessage(
  channelId: string,
  blocks: object[]
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] SLACK_BOT_TOKEN not set — message not sent");
    return;
  }

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: channelId, blocks }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[slack] chat.postMessage failed:", data.error);
    }
  } catch (err) {
    console.error("[slack] sendSlackMessage error:", err);
  }
}

export async function sendSlackText(
  channelId: string,
  text: string
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] SLACK_BOT_TOKEN not set — message not sent");
    return;
  }

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: channelId, text }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[slack] chat.postMessage (text) failed:", data.error);
    }
  } catch (err) {
    console.error("[slack] sendSlackText error:", err);
  }
}

export async function sendSlackFile(
  channelId: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] SLACK_BOT_TOKEN not set — file not sent");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("channels", channelId);
    formData.append(
      "file",
      new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
      filename
    );
    formData.append("filename", filename);

    const res = await fetch("https://slack.com/api/files.upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[slack] files.upload failed:", data.error);
    }
  } catch (err) {
    console.error("[slack] sendSlackFile error:", err);
  }
}

interface AgentRunSummary {
  id: string;
  deployment: { name: string };
  decision: string | null;
  previousScore: number | null;
  newScore: number | null;
  regressionFound: boolean;
  rootCause: string | null;
}

export function buildRegressionBlocks(agentRun: AgentRunSummary): object[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isRegression = agentRun.regressionFound;
  const decision = agentRun.decision ?? "UNKNOWN";
  const prevScore = agentRun.previousScore?.toFixed(2) ?? "N/A";
  const newScore = agentRun.newScore?.toFixed(2) ?? "N/A";
  const decisionEmoji = isRegression ? "❌" : "✅";
  const headerText = isRegression
    ? "⚠️ Regression Detected — Veridian"
    : "✅ Eval Passed — Veridian";

  const blocks: object[] = [
    {
      type: "header",
      text: { type: "plain_text", text: headerText, emoji: true },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Deployment:*\n${agentRun.deployment.name}`,
        },
        {
          type: "mrkdwn",
          text: `*Decision:*\n${decisionEmoji} ${decision}`,
        },
        {
          type: "mrkdwn",
          text: `*Previous Score:*\n${prevScore}`,
        },
        {
          type: "mrkdwn",
          text: `*New Score:*\n${newScore}`,
        },
      ],
    },
  ];

  if (isRegression && agentRun.rootCause) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Root Cause:*\n${agentRun.rootCause}`,
      },
    });
  }

  blocks.push({ type: "divider" });
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "View in Veridian →", emoji: true },
        url: `${appUrl}/agent`,
      },
    ],
  });

  return blocks;
}

export const buildPassBlocks = buildRegressionBlocks;

export function parseSlashCommand(text: string): {
  subcommand: string;
  args: string;
} {
  const normalized = (text ?? "").trim();
  const lowered = normalized.toLowerCase();

  if (lowered.startsWith("check ")) {
    return { subcommand: "check", args: normalized.slice(6).trim() };
  }
  if (lowered === "check") return { subcommand: "check", args: "" };
  if (lowered === "status") return { subcommand: "status", args: "" };
  if (lowered === "help" || lowered === "") {
    return { subcommand: "help", args: "" };
  }

  return { subcommand: "unknown", args: normalized };
}