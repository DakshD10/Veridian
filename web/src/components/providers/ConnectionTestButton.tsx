"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Wifi } from "lucide-react";
import { testConnection } from "@/hooks/useProviders";

interface ConnectionTestButtonProps {
  baseUrl: string;
  modelId: string;
  apiKey?: string | null;
  providerId?: string;
  onSuccess?: (latencyMs: number) => void;
  disabled?: boolean;
}

export function ConnectionTestButton({
  baseUrl,
  modelId,
  apiKey,
  providerId,
  onSuccess,
  disabled,
}: ConnectionTestButtonProps) {
  const [state, setState] = useState<"idle" | "testing" | "success" | "error">(
    "idle"
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleTest() {
    if (!baseUrl || !modelId) return;
    setState("testing");
    setErrorMsg(null);

    const result = await testConnection({ baseUrl, modelId, apiKey, providerId });

    if (result.ok) {
      setState("success");
      setLatencyMs(result.latencyMs ?? null);
      onSuccess?.(result.latencyMs ?? 0);
    } else {
      setState("error");
      setErrorMsg(result.error ?? "Connection failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={disabled || state === "testing" || !baseUrl || !modelId}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-[#27272A] hover:bg-[#18181B] text-[#A1A1AA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-fit"
      >
        {state === "testing" ? (
          <Loader2 size={14} className="animate-spin text-violet-500" />
        ) : (
          <Wifi size={14} />
        )}
        {state === "testing" ? "Testing..." : "Test Connection"}
      </button>

      {/* Success state */}
      {state === "success" && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle2 size={14} />
          <span>Connected</span>
          {latencyMs !== null && (
            <span className="font-mono text-xs text-[#52525B]">{latencyMs}ms</span>
          )}
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <XCircle size={14} />
          <span className="text-xs">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
