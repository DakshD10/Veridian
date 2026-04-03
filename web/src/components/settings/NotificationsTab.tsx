"use client";

import { SlackConfig } from "./SlackConfig";
import { TelegramConfig } from "./TelegramConfig";

export function NotificationsTab() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-[#FAFAFA] font-semibold text-sm">Notification Channels</h2>
        <p className="text-xs text-[#71717A]">
          Configure Slack and Telegram to trigger evals and receive results.
        </p>
      </div>

      <SlackConfig />

      <div className="border-t border-[#1F1F23]" />

      <TelegramConfig />
    </div>
  );
}
