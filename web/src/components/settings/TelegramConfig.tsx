"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TelegramConfig() {
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [isSetting, setIsSetting] = useState(false);

  async function handleSetWebhook() {
    if (!ngrokUrl.trim()) {
      toast.error("Enter your ngrok URL first");
      return;
    }

    setIsSetting(true);
    try {
      const webhookUrl = `${ngrokUrl.trim()}/api/telegram/webhook`;
      const res = await fetch("/api/telegram/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });

      if (res.ok) {
        toast.success("Telegram webhook set successfully");
      } else {
        toast.error("Failed to set webhook — check TELEGRAM_BOT_TOKEN");
      }
    } catch {
      toast.error("Failed to set webhook");
    } finally {
      setIsSetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[#FAFAFA] font-semibold text-sm">Telegram Bot Integration</h3>
        <p className="text-xs text-[#71717A]">
          Trigger evals and receive PDF reports directly in Telegram.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4 bg-[#18181B] border border-[#27272A] rounded-md">
        <p className="text-xs uppercase tracking-wide text-[#71717A]">
          Required Environment Variable
        </p>
        <div className="flex items-center justify-between gap-4">
          <code className="font-mono text-xs text-[#A1A1AA]">TELEGRAM_BOT_TOKEN</code>
          <span className="text-xs text-[#52525B]">From @BotFather on Telegram</span>
        </div>
        <p className="text-xs text-[#52525B]">
          Add to <code className="font-mono">.env.local</code> and restart the server.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-[#71717A]">
          Webhook Setup (ngrok required for local demo)
        </p>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#71717A]">ngrok HTTPS URL</label>
          <div className="flex items-center gap-2">
            <input
              value={ngrokUrl}
              onChange={(e) => setNgrokUrl(e.target.value)}
              placeholder="https://abc123.ngrok.io"
              className="flex-1 bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] font-mono placeholder:text-[#52525B] focus:outline-none focus:border-violet-500/50"
            />
            <button
              type="button"
              onClick={handleSetWebhook}
              disabled={isSetting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm border border-[#27272A] hover:bg-[#18181B] text-[#A1A1AA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSetting ? <Loader2 size={14} className="animate-spin" /> : null}
              Set Webhook
            </button>
          </div>
          <p className="text-xs text-[#52525B]">
            Webhook will be set to: {ngrokUrl || "[ngrok-url]"}/api/telegram/webhook
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 bg-[#111113] border border-[#27272A] rounded-md">
        <p className="text-xs uppercase tracking-wide text-[#71717A]">
          Available Bot Commands
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { cmd: "/check [deployment-name]", desc: "Run eval and receive PDF report" },
            { cmd: "/status", desc: "Show last run for all deployments" },
            { cmd: "/suites", desc: "List eval suites" },
            { cmd: "/help", desc: "Show available commands" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex flex-col gap-0.5">
              <code className="font-mono text-xs text-violet-400">{cmd}</code>
              <span className="text-xs text-[#71717A] pl-1">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="https://t.me/botfather"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors w-fit"
      >
        <ExternalLink size={12} />
        Create a bot with @BotFather →
      </a>
    </div>
  );
}
