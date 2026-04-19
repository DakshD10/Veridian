import crypto from "crypto";
import type { NextRequest } from "next/server";

type SlackPostOptions = {
  text?: string;
  threadTs?: string;
};

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
  blocks: object[],
  options: SlackPostOptions = {}
): Promise<{ ok: boolean; ts?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] SLACK_BOT_TOKEN not set — message not sent");
    return { ok: false };
  }

  try {
    const payload: Record<string, unknown> = {
      channel: channelId,
      blocks,
      text: options.text ?? "Veridian update",
    };

    if (options.threadTs) {
      payload.thread_ts = options.threadTs;
    }

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[slack] chat.postMessage failed:", data.error);
      return { ok: false };
    }

    return { ok: true, ts: typeof data.ts === "string" ? data.ts : undefined };
  } catch (err) {
    console.error("[slack] sendSlackMessage error:", err);
    return { ok: false };
  }
}

export async function sendSlackText(
  channelId: string,
  text: string,
  options: SlackPostOptions = {}
): Promise<{ ok: boolean; ts?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] SLACK_BOT_TOKEN not set — message not sent");
    return { ok: false };
  }

  try {
    const payload: Record<string, unknown> = {
      channel: channelId,
      text,
    };

    if (options.threadTs) {
      payload.thread_ts = options.threadTs;
    }

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[slack] chat.postMessage (text) failed:", data.error);
      return { ok: false };
    }

    return { ok: true, ts: typeof data.ts === "string" ? data.ts : undefined };
  } catch (err) {
    console.error("[slack] sendSlackText error:", err);
    return { ok: false };
  }
}

export async function sendSlackFile(
  channelId: string,
  pdfBuffer: Buffer,
  filename: string,
  options: { threadTs?: string } = {}
): Promise<{ ok: boolean; error?: string; details?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] SLACK_BOT_TOKEN not set — file not sent");
    return { ok: false, error: "missing_bot_token" };
  }

  try {
    const urlRes = await fetch(
      "https://slack.com/api/files.getUploadURLExternal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename,
          length: pdfBuffer.byteLength,
        }),
      }
    );

    const urlData = await urlRes.json();
    if (!urlData.ok) {
      console.error(
        "[slack] files.getUploadURLExternal failed:",
        urlData.error
      );
      const error = typeof urlData.error === "string" ? urlData.error : "upload_url_failed";
      return { ok: false, error };
    }

    const { upload_url, file_id } = urlData;

    let uploadRes = await fetch(upload_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.byteLength),
      },
      body: pdfBuffer,
    });

    if (!uploadRes.ok) {
      // Fallback: Slack also supports multipart uploads to the upload URL.
      const form = new FormData();
      form.append(
        "filename",
        new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
        filename
      );

      uploadRes = await fetch(upload_url, {
        method: "POST",
        body: form,
      });
    }

    if (!uploadRes.ok) {
      const uploadError = `upload_http_${uploadRes.status}`;
      console.error(
        "[slack] file upload to presigned URL failed:",
        uploadRes.status,
        uploadRes.statusText
      );
      return { ok: false, error: uploadError };
    }

    const filesArg = [{ id: file_id, title: filename }];
    const filesArgNoTitle = [{ id: file_id }];
    const completePayloadBase: Record<string, unknown> = {
      files: filesArg,
      channel_id: channelId,
    };

    const completeWithPayload = async (
      payload: Record<string, unknown>,
      asForm: boolean = false
    ) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      let body: string;
      if (asForm) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        const form = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
          if (value === undefined || value === null) continue;
          if (key === "files") {
            form.set("files", JSON.stringify(value));
          } else {
            form.set(key, String(value));
          }
        }
        body = form.toString();
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }

      const completeRes = await fetch(
        "https://slack.com/api/files.completeUploadExternal",
        {
          method: "POST",
          headers,
          body,
        }
      );
      const completeData = await completeRes.json();
      return { completeRes, completeData };
    };

    const firstPayload = {
      ...completePayloadBase,
      ...(options.threadTs ? { thread_ts: options.threadTs } : {}),
    };
    let { completeData } = await completeWithPayload(firstPayload);

    if (!completeData.ok && options.threadTs && completeData.error === "invalid_thread_ts") {
      // Retry without thread context so report is still delivered.
      ({ completeData } = await completeWithPayload(completePayloadBase));
    }

    if (!completeData.ok && completeData.error === "not_in_channel") {
      const joined = await ensureBotInChannel(token, channelId);
      if (joined) {
        ({ completeData } = await completeWithPayload(firstPayload));
        if (!completeData.ok && options.threadTs && completeData.error === "invalid_thread_ts") {
          ({ completeData } = await completeWithPayload(completePayloadBase));
        }
      }
    }

    if (!completeData.ok && completeData.error === "invalid_arguments" && options.threadTs) {
      // Some workspaces reject thread_ts in completeUploadExternal with generic invalid_arguments.
      ({ completeData } = await completeWithPayload(completePayloadBase));
    }

    if (!completeData.ok && completeData.error === "invalid_arguments") {
      // Some workspaces are stricter on arg shape; retry with `channels`.
      const channelsPayload = {
        files: filesArg,
        channels: channelId,
      };
      ({ completeData } = await completeWithPayload(channelsPayload));
    }

    if (!completeData.ok && completeData.error === "invalid_arguments" && options.threadTs) {
      const channelsThreadPayload = {
        files: filesArg,
        channels: channelId,
        thread_ts: options.threadTs,
      };
      ({ completeData } = await completeWithPayload(channelsThreadPayload));
    }

    if (!completeData.ok && completeData.error === "invalid_arguments") {
      // Retry using form-encoded body with files as a JSON string.
      const formPayload = {
        files: filesArg,
        channel_id: channelId,
      };
      ({ completeData } = await completeWithPayload(formPayload, true));
    }

    if (!completeData.ok && completeData.error === "invalid_arguments" && options.threadTs) {
      const formThreadPayload = {
        files: filesArg,
        channel_id: channelId,
        thread_ts: options.threadTs,
      };
      ({ completeData } = await completeWithPayload(formThreadPayload, true));
    }

    if (!completeData.ok && completeData.error === "invalid_arguments") {
      // Some workspaces reject explicit `title` in `files` objects.
      const noTitlePayload = {
        files: filesArgNoTitle,
        channel_id: channelId,
      };
      ({ completeData } = await completeWithPayload(noTitlePayload));
    }

    if (!completeData.ok && completeData.error === "invalid_arguments" && options.threadTs) {
      const noTitleThreadPayload = {
        files: filesArgNoTitle,
        channel_id: channelId,
        thread_ts: options.threadTs,
      };
      ({ completeData } = await completeWithPayload(noTitleThreadPayload));
    }

    if (!completeData.ok) {
      const error = typeof completeData.error === "string" ? completeData.error : "complete_upload_failed";
      const details = Array.isArray(completeData.response_metadata?.messages)
        ? completeData.response_metadata.messages
            .filter((message: unknown): message is string => typeof message === "string")
            .join(" | ")
        : undefined;
      console.error(
        "[slack] files.completeUploadExternal failed:",
        error,
        details ?? ""
      );
      return { ok: false, error, details };
    }

    return { ok: true };
  } catch (err) {
    console.error("[slack] sendSlackFile error:", err);
    return { ok: false, error: "send_file_exception" };
  }
}

async function ensureBotInChannel(token: string, channelId: string): Promise<boolean> {
  try {
    const joinRes = await fetch("https://slack.com/api/conversations.join", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ channel: channelId }).toString(),
    });
    const joinData = await joinRes.json();
    if (!joinData.ok && joinData.error !== "method_not_supported_for_channel_type") {
      console.error("[slack] conversations.join failed:", joinData.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[slack] conversations.join exception:", err);
    return false;
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

export function buildDeploymentPickerBlocks(
  deployments: Array<{ id: string; name: string }>,
  userId: string
): object[] {
  const blocks: object[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hey <@${userId}>. Pick a deployment below to run an evaluation:`,
      },
    },
  ];

  for (const deployment of deployments) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${deployment.name}*`,
      },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "🚀 Run", emoji: true },
        action_id: "run_deployment_eval",
        value: deployment.id,
      },
    });
  }

  return blocks;
}

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
