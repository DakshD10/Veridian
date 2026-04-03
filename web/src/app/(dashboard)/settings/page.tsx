"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { ProvidersTab } from "@/components/providers/ProvidersTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";

type Tab = "providers" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("providers");

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8">
      <Toaster richColors />

      <div className="flex flex-col gap-8 max-w-3xl">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[#FAFAFA] text-2xl font-semibold">Settings</h1>
          <p className="text-[#71717A] text-sm">
            Manage custom model providers and notification channels.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#27272A]">
          {(["providers", "notifications"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-violet-500 text-[#FAFAFA]"
                  : "border-transparent text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "providers" && <ProvidersTab />}

        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}
