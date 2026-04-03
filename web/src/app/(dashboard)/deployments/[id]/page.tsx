"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ModelOption } from "@/types";

interface AgentRunSummary {
  id: string;
  status: string;
  triggerEvent: string;
  createdAt: string;
  regressionFound: boolean;
}

interface DeploymentDetail {
  id: string;
  name: string;
  currentModel: string;
  threshold: number;
  slackChannelId: string | null;
  telegramChatId: string | null;
  suite: { name: string };
  agentRuns: AgentRunSummary[];
}

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full p-8 gap-6">
      <Skeleton className="h-4 w-37.5 bg-[#121215]/50 rounded" />
      <Skeleton className="h-8 w-62.5 bg-[#121215]/50 rounded" />
      <Skeleton className="h-62.5 w-full bg-[#121215]/50 rounded-lg" />
    </div>
  );
}

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isTriggering, setIsTriggering] = useState(false);
  const [slackChannelId, setSlackChannelId] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: deployment,
    isLoading,
    isError,
  } = useQuery<DeploymentDetail>({
    queryKey: ["deployment", id],
    queryFn: async () => {
      const res = await fetch(`/api/deployments/${id}`);
      if (!res.ok) throw new Error("Failed to fetch deployment");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: availableModels = [] } = useQuery<ModelOption[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });

  useEffect(() => {
    if (!deployment) return;
    setSlackChannelId(deployment.slackChannelId ?? "");
    setTelegramChatId(deployment.telegramChatId ?? "");
  }, [deployment]);

  const handleTriggerAgent = async () => {
    if (!selectedModel || !deployment) return;
    
    setIsTriggering(true);
    try {
      const triggerEvent = `Model changed to ${selectedModel}`;
      const res = await fetch(`/api/deployments/${id}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newModelId: selectedModel,
          triggerEvent,
        }),
      });

      if (!res.ok) throw new Error("Failed to trigger agent");

      const { agentRunId } = await res.json();
      setIsModalOpen(false);
      setSelectedModel("");
      router.push(`/agent?agentRunId=${agentRunId}`);
    } catch (error) {
      console.error("Failed to trigger agent:", error);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSelectValueChange = (value: string | null) => {
    setSelectedModel(value || "");
  };

  async function handleSaveChannels() {
    if (!deployment) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/deployments/${deployment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackChannelId: slackChannelId || null,
          telegramChatId: telegramChatId || null,
        }),
      });

      if (res.ok) {
        toast.success("Notification channels saved");
      } else {
        toast.error("Failed to save channels");
      }
    } catch {
      toast.error("Failed to save channels");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">Deployment not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full p-8 max-w-308">
      <Link
        href="/deployments"
        className="text-[#71717A] hover:text-[#FAFAFA] transition-colors font-sans text-[13px] mb-6 w-fit"
      >
        ← Back to Deployments List
      </Link>

      <div className="border border-[#1F1F23] rounded-xl bg-[#121215] p-6">
        <h1 className="text-[20px] font-bold text-[#FAFAFA] font-sans">{deployment.name}</h1>
        <p className="text-[13px] text-[#71717A] mt-1">Suite: {deployment.suite.name}</p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#0A0A0D]">
            <p className="text-xs text-[#52525B] uppercase">Current Model</p>
            <p className="text-sm font-mono text-[#A1A1AA] mt-1">{deployment.currentModel}</p>
          </div>
          <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#0A0A0D]">
            <p className="text-xs text-[#52525B] uppercase">Threshold</p>
            <p className="text-sm font-mono text-[#A1A1AA] mt-1">{deployment.threshold.toFixed(2)}</p>
          </div>
          <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#0A0A0D]">
            <p className="text-xs text-[#52525B] uppercase">Recent Agent Runs</p>
            <p className="text-sm font-mono text-[#A1A1AA] mt-1">{deployment.agentRuns.length}</p>
          </div>
        </div>

        <div className="mt-6">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger 
              className="group/btn inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-[rgba(239,68,68,0.6)] text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 bg-transparent px-4 py-2"
            >
              Simulate Version Change
            </DialogTrigger>
            <DialogContent className="bg-[#121215] border-[#1F1F23] text-[#FAFAFA]">
              <DialogHeader>
                <DialogTitle>Simulate Model Version Change</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#71717A] mb-2">Current Model</p>
                  <div className="border border-[#27272A] rounded-lg px-3 py-2 bg-[#0A0A0D]">
                    <span className="text-green-400 text-sm font-medium">{deployment.currentModel}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-[#71717A] mb-2">New Model</p>
                  <Select value={selectedModel} onValueChange={handleSelectValueChange}>
                    <SelectTrigger className="bg-[#0A0A0D] border-[#27272A] text-[#FAFAFA]">
                      <SelectValue placeholder="Select a new model..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0D] border-[#27272A]">
                      {availableModels.map((model) => (
                        <SelectItem 
                          key={model.id} 
                          value={model.id}
                          className="text-[#FAFAFA]"
                        >
                          {model.label} ({model.speed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border border-[#F59E0B] bg-[rgba(245,158,11,0.1)] rounded-lg p-3">
                  <p className="text-xs text-[#F59E0B]">
                    ⚠️ This will trigger the autonomous regression watcher agent to run the full eval suite against the new model. Estimated run time: 2-5 minutes.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTriggerAgent}
                    disabled={!selectedModel || isTriggering}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isTriggering ? "Triggering..." : "Trigger Agent"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 flex flex-col gap-4 p-4 bg-[#111113] border border-[#27272A] rounded-lg">
          <h3 className="text-[#FAFAFA] font-semibold text-sm">Notification Channels</h3>
          <p className="text-xs text-[#71717A]">
            Agent results are sent here when a regression is detected.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wide text-[#71717A]">
                Slack Channel ID
              </label>
              <input
                value={slackChannelId}
                onChange={(e) => setSlackChannelId(e.target.value)}
                placeholder="C0123456789"
                className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] font-mono placeholder:text-[#52525B] focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wide text-[#71717A]">
                Telegram Chat ID
              </label>
              <input
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="123456789"
                className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] font-mono placeholder:text-[#52525B] focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveChannels}
            disabled={isSaving}
            className="w-fit px-4 py-2 rounded-md text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save Channels"}
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-[#FAFAFA] mb-3">Recent Agent Runs</h2>
          {!deployment.agentRuns || deployment.agentRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <p className="text-sm text-muted-foreground">No agent runs yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deployment.agentRuns.map((agentRun) => (
                <div key={agentRun.id} className="border border-[#1F1F23] rounded-lg p-3 bg-[#0A0A0D]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#FAFAFA]">{agentRun.triggerEvent}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-[#71717A]">{new Date(agentRun.createdAt).toLocaleString()}</p>
                      <Link
                        href={`/agent?agentRunId=${agentRun.id}`}
                        className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        View report
                      </Link>
                    </div>
                  </div>
                  <p className="text-xs mt-1 text-[#A1A1AA]">
                    Status: {agentRun.status} {agentRun.regressionFound ? "· Regression found" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
