"use client";

import { ExternalLink } from "lucide-react";

export function SlackConfig() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[#FAFAFA] font-semibold text-sm">Slack Integration</h3>
        <p className="text-xs text-[#71717A]">
          Trigger evals with{" "}
          <code className="font-mono bg-[#18181B] px-1 rounded">
            /veridian check [deployment]
          </code>{" "}
          and receive rich Block Kit results.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4 bg-[#18181B] border border-[#27272A] rounded-md">
        <p className="text-xs uppercase tracking-wide text-[#71717A]">
          Required Environment Variables
        </p>
        <div className="flex flex-col gap-2">
          {[
            { key: "SLACK_BOT_TOKEN", hint: "xoxb-..." },
            { key: "SLACK_SIGNING_SECRET", hint: "From app settings → Basic Info" },
          ].map(({ key, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <code className="font-mono text-xs text-[#A1A1AA]">{key}</code>
              <span className="text-xs text-[#52525B]">{hint}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#52525B]">
          Add to <code className="font-mono">.env.local</code> and restart the server.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-[#71717A]">Setup Steps</p>
        <ol className="flex flex-col gap-2 list-decimal list-inside">
          {[
            "Create a Slack App at api.slack.com",
            "Enable Slash Commands → /veridian → Request URL: {ngrok-url}/api/slack/command",
            "Add OAuth Scopes: chat:write, files:write, commands",
            "Install app to workspace → copy Bot Token to SLACK_BOT_TOKEN",
            "Copy Signing Secret to SLACK_SIGNING_SECRET",
            "Set a deployment's Slack Channel ID in Deployments → [deployment] → Notification Channels",
          ].map((step, i) => (
            <li key={i} className="text-xs text-[#A1A1AA] leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2 p-4 bg-[#111113] border border-[#27272A] rounded-md">
        <p className="text-xs uppercase tracking-wide text-[#71717A]">Available Commands</p>
        <div className="flex flex-col gap-1.5">
          {[
            {
              cmd: "/veridian check [deployment-name]",
              desc: "Run eval and post results to channel",
            },
            { cmd: "/veridian status", desc: "Show last run status for all deployments" },
            { cmd: "/veridian help", desc: "Show available commands" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex flex-col gap-0.5">
              <code className="font-mono text-xs text-violet-400">{cmd}</code>
              <span className="text-xs text-[#71717A] pl-1">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="https://api.slack.com/apps"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors w-fit"
      >
        <ExternalLink size={12} />
        Slack App Setup Guide →
      </a>
    </div>
  );
}
